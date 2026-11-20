package com.nitpick.review;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.github.GithubClient;
import com.nitpick.security.CryptoService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Safety net for missed webhooks. GitHub gives a webhook 10 seconds and never retries, so a pull request
 * opened while the server is asleep would otherwise never be reviewed. Every few minutes this looks at the
 * open pull requests of enabled repositories and queues any head commit that has not been seen yet.
 */
@Component
public class PullSyncService {
    private static final Logger log = LoggerFactory.getLogger(PullSyncService.class);
    private static final Duration MAX_AGE = Duration.ofHours(24);

    private final JdbcTemplate jdbc;
    private final GithubClient github;
    private final CryptoService crypto;
    private final PullQueue queue;

    public PullSyncService(JdbcTemplate jdbc, GithubClient github, CryptoService crypto, PullQueue queue) {
        this.jdbc = jdbc;
        this.github = github;
        this.crypto = crypto;
        this.queue = queue;
    }

    @Scheduled(fixedDelay = 600_000, initialDelay = 90_000)
    public void sync() {
        List<Map<String, Object>> repos;
        try {
            repos = jdbc.queryForList("""
                    SELECT r.id, r.full_name, r.created_at, u.token_enc
                    FROM repos r JOIN users u ON u.id = r.user_id
                    WHERE r.enabled = TRUE""");
        } catch (Exception e) {
            log.warn("PR sweep could not list repositories: {}", e.getMessage());
            return;
        }
        for (Map<String, Object> repo : repos) {
            try {
                sweep(repo);
            } catch (Exception e) {
                log.warn("PR sweep failed for {}: {}", repo.get("full_name"), e.getMessage());
            }
        }
    }

    private void sweep(Map<String, Object> repo) {
        long repoId = ((Number) repo.get("id")).longValue();
        String fullName = (String) repo.get("full_name");
        Instant enabledAt = ((java.sql.Timestamp) repo.get("created_at")).toInstant();
        String token = crypto.decrypt((String) repo.get("token_enc"));
        JsonNode open = github.openPulls(token, fullName);
        if (open == null || !open.isArray()) return;
        for (JsonNode pr : open) {
            int number = pr.path("number").asInt();
            String sha = pr.path("head").path("sha").asText("");
            if (number == 0 || sha.isEmpty()) continue;
            if (!worthQueueing(Instant.parse(pr.path("updated_at").asText("1970-01-01T00:00:00Z")), enabledAt, Instant.now())) continue;
            Integer seen = jdbc.queryForObject(
                    "SELECT count(*) FROM pulls WHERE repo_id=? AND number=? AND head_sha=?", Integer.class, repoId, number, sha);
            if (seen != null && seen > 0) continue;
            log.info("PR sweep found unreviewed {}#{} ({}), queueing", fullName, number, sha.substring(0, Math.min(7, sha.length())));
            queue.enqueue(repoId, number, pr.path("title").asText(""), pr.path("user").path("login").asText(""), sha);
        }
    }

    /** Only pull requests touched after the repository was enabled and within the last day are picked up. */
    static boolean worthQueueing(Instant updatedAt, Instant enabledAt, Instant now) {
        return updatedAt.isAfter(enabledAt) && updatedAt.isAfter(now.minus(MAX_AGE));
    }
}
