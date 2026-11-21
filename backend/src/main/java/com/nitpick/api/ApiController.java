package com.nitpick.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.config.Props;
import com.nitpick.github.GithubClient;
import com.nitpick.security.CryptoService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final JdbcTemplate jdbc;
    private final GithubClient github;
    private final CryptoService crypto;
    private final Props props;
    private final com.nitpick.messaging.RedisGate redis;
    private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();

    public ApiController(JdbcTemplate jdbc, GithubClient github, CryptoService crypto, Props props, com.nitpick.messaging.RedisGate redis) {
        this.redis = redis;
        this.jdbc = jdbc;
        this.github = github;
        this.crypto = crypto;
        this.props = props;
    }

    private static final String PULL_COLS = """
            p.id, p.number, p.title, r.full_name AS "repo", p.author, p.created_at AS "when", p.status, p.score,
            p.critical AS "c", p.warnings AS "w", p.tips AS "s\"""";

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Long uid) {
        return jdbc.queryForMap(
                "SELECT id, login, name, avatar_url AS \"avatarUrl\", email FROM users WHERE id=?", uid);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@AuthenticationPrincipal Long uid) {
        Map<String, Object> t = jdbc.queryForMap("""
                WITH owned_repos AS (
                    SELECT id FROM repos WHERE user_id=?
                ),
                user_pulls AS (
                    SELECT p.* FROM pulls p JOIN owned_repos r ON r.id=p.repo_id
                    WHERE p.created_at >= now() - interval '30 days'
                ),
                user_findings AS (
                    SELECT f.* FROM findings f JOIN user_pulls p ON p.id=f.pull_id
                )
                SELECT
                    (SELECT count(*) FROM user_pulls WHERE status='reviewed') AS reviewed,
                    (SELECT count(*) FROM user_findings WHERE severity='critical') AS critical,
                    (SELECT count(*) FROM user_findings WHERE severity='warning') AS warnings,
                    (SELECT count(*) FROM user_findings WHERE severity='suggestion') AS tips,
                    coalesce((SELECT round(avg(score)) FROM user_pulls WHERE status='reviewed'),0) AS avg_score,
                    coalesce((SELECT round(extract(epoch FROM percentile_cont(0.5) WITHIN GROUP
                      (ORDER BY reviewed_at - created_at)))
                      FROM user_pulls WHERE status='reviewed' AND reviewed_at IS NOT NULL),0) AS median_seconds
                """, uid);
        Map<LocalDate, Integer> byDay = new HashMap<>();
        jdbc.query("""
                SELECT (p.reviewed_at AT TIME ZONE 'UTC')::date AS d, round(avg(p.score)) AS s
                FROM pulls p JOIN repos r ON r.id=p.repo_id
                WHERE r.user_id=? AND p.status='reviewed' AND p.reviewed_at > now() - interval '30 days'
                GROUP BY 1""", rs -> {
            byDay.put(rs.getDate("d").toLocalDate(), rs.getInt("s"));
        }, uid);
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now(java.time.ZoneOffset.UTC);
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            // Keep null days empty. Carrying the previous score forward creates
            // a misleading flat line when no pull request was reviewed that day.
            Map<String, Object> pt = new HashMap<>();
            pt.put("date", d.toString());
            pt.put("score", byDay.get(d));
            trend.add(pt);
        }
        t.put("trend", trend);
        return t;
    }

    @GetMapping("/pulls")
    public List<Map<String, Object>> pulls(@AuthenticationPrincipal Long uid) {
        return jdbc.queryForList("SELECT " + PULL_COLS + " FROM pulls p JOIN repos r ON r.id=p.repo_id WHERE r.user_id=? ORDER BY p.created_at DESC LIMIT 100", uid);
    }

    @PostMapping("/pulls/{id}/retry")
    public ResponseEntity<Map<String, Object>> retryPull(
            @AuthenticationPrincipal Long uid,
            @PathVariable long id) {
        List<Long> owned = jdbc.queryForList("""
                SELECT p.id
                FROM pulls p JOIN repos r ON r.id=p.repo_id
                WHERE p.id=? AND r.user_id=?
                """, Long.class, id, uid);
        if (owned.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Integer active = jdbc.queryForObject(
                "SELECT count(*) FROM jobs WHERE pull_id=? AND status IN ('queued','running')",
                Integer.class, id);
        if (active != null && active > 0) {
            return ResponseEntity.accepted().body(Map.of("status", "queued"));
        }
        jdbc.update("""
                UPDATE pulls
                SET status='queued', score=NULL, critical=0, warnings=0, tips=0,
                    summary=NULL, reviewed_at=NULL
                WHERE id=?
                """, id);
        jdbc.update("INSERT INTO jobs(pull_id) VALUES (?)", id);
        return ResponseEntity.accepted().body(Map.of("status", "queued"));
    }

    @GetMapping("/pulls/{id}")
    public ResponseEntity<Map<String, Object>> pull(@AuthenticationPrincipal Long uid, @PathVariable long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT " + PULL_COLS + ", p.summary FROM pulls p JOIN repos r ON r.id=p.repo_id WHERE r.user_id=? AND p.id=?", uid, id);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        Map<String, Object> pr = new HashMap<>(rows.get(0));
        pr.put("findings", jdbc.queryForList("""
                SELECT id, file, line, severity, category, message_en AS "en", message_ta AS "ta", fix
                FROM findings WHERE pull_id=? ORDER BY file, line""", id));
        return ResponseEntity.ok(pr);
    }

    @GetMapping("/findings")
    public List<Map<String, Object>> findings(@AuthenticationPrincipal Long uid) {
        return jdbc.queryForList("""
                SELECT f.id, f.pull_id AS "pullId", p.number, r.full_name AS "repo", f.file, f.line, f.severity,
                       f.category, f.message_en AS "en", f.message_ta AS "ta", f.fix, f.resolved, f.created_at AS "when"
                FROM findings f JOIN pulls p ON p.id=f.pull_id JOIN repos r ON r.id=p.repo_id
                WHERE r.user_id=? ORDER BY f.created_at DESC, f.id LIMIT 200""", uid);
    }

    @PutMapping("/findings/{id}")
    public ResponseEntity<Void> resolveFinding(
            @AuthenticationPrincipal Long uid,
            @PathVariable long id,
            @RequestBody Map<String, Object> body) {
        boolean resolved = Boolean.TRUE.equals(body.get("resolved"));
        int updated = jdbc.update("""
                UPDATE findings f
                SET resolved=?
                FROM pulls p JOIN repos r ON r.id=p.repo_id
                WHERE f.pull_id=p.id AND f.id=? AND r.user_id=?
                """, resolved, id, uid);
        return updated == 0 ? ResponseEntity.notFound().build() : ResponseEntity.noContent().build();
    }

    @GetMapping("/rules")
    public List<Map<String, Object>> rules(@AuthenticationPrincipal Long uid) {
        return jdbc.queryForList("SELECT id, name, description, enabled FROM rules WHERE user_id=? ORDER BY id", uid);
    }

    @PostMapping("/rules")
    public Map<String, Object> addRule(@AuthenticationPrincipal Long uid, @RequestBody Map<String, Object> b) {
        String name = String.valueOf(b.getOrDefault("name", "")).trim();
        if (name.isEmpty() || name.length() > 120) throw new IllegalArgumentException("name required");
        String desc = String.valueOf(b.getOrDefault("description", "")).trim();
        if (desc.length() > 400) desc = desc.substring(0, 400);
        return jdbc.queryForMap(
                "INSERT INTO rules(user_id,name,description) VALUES (?,?,?) RETURNING id, name, description, enabled", uid, name, desc);
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<Void> setRule(@AuthenticationPrincipal Long uid, @PathVariable long id, @RequestBody Map<String, Object> b) {
        boolean enabled = Boolean.TRUE.equals(b.get("enabled"));
        int n = jdbc.update("UPDATE rules SET enabled=? WHERE id=? AND user_id=?", enabled, id, uid);
        return n == 0 ? ResponseEntity.notFound().build() : ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@AuthenticationPrincipal Long uid, @PathVariable long id) {
        int n = jdbc.update("DELETE FROM rules WHERE id=? AND user_id=?", id, uid);
        return n == 0 ? ResponseEntity.notFound().build() : ResponseEntity.noContent().build();
    }

    @GetMapping("/settings")
    public Map<String, Object> settings(@AuthenticationPrincipal Long uid) {
        return jdbc.queryForMap("SELECT lang, strictness, fail_check AS \"failCheck\" FROM users WHERE id=?", uid);
    }

    @PutMapping("/settings")
    public Map<String, Object> saveSettings(@AuthenticationPrincipal Long uid, @RequestBody Map<String, Object> b) {
        String lang = "en";
        Object s = b.get("strictness");
        String strict = "light".equals(s) || "strict".equals(s) ? (String) s : "balanced";
        jdbc.update("UPDATE users SET lang=?, strictness=?, fail_check=? WHERE id=?",
                lang, strict, Boolean.TRUE.equals(b.get("failCheck")), uid);
        return settings(uid);
    }

    @GetMapping("/repos")
    public List<Map<String, Object>> repos(@AuthenticationPrincipal Long uid) {
        String token = token(uid);
        Set<String> on = new HashSet<>(jdbc.queryForList("SELECT full_name FROM repos WHERE user_id=? AND enabled=TRUE", String.class, uid));
        List<Map<String, Object>> out = new ArrayList<>();
        JsonNode list = cachedRepoList(uid, token);
        if (list != null && list.isArray()) {
            for (JsonNode r : list) {
                Map<String, Object> m = new HashMap<>();
                String name = r.path("full_name").asText();
                m.put("fullName", name);
                m.put("private", r.path("private").asBoolean(false));
                m.put("enabled", on.contains(name));
                out.add(m);
            }
        }
        return out;
    }

    /** GitHub's repo list changes rarely, so keep it in Redis for a minute. Falls back to GitHub when Redis is off. */
    private JsonNode cachedRepoList(Long uid, String token) {
        String key = "repos:" + uid;
        String hit = redis.get(key);
        if (hit != null) {
            try { return json.readTree(hit); } catch (Exception ignored) { }
        }
        JsonNode fresh = github.listRepos(token);
        if (fresh != null && fresh.isArray()) redis.put(key, fresh.toString(), 60);
        return fresh;
    }

    @PostMapping("/repos/toggle")
    public ResponseEntity<Map<String, Object>> toggle(@AuthenticationPrincipal Long uid, @RequestBody Map<String, Object> b) {
        String full = String.valueOf(b.getOrDefault("fullName", ""));
        if (!full.matches("[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")) return ResponseEntity.badRequest().build();
        boolean enable = Boolean.TRUE.equals(b.get("enabled"));
        String token = token(uid);
        List<Map<String, Object>> existing = jdbc.queryForList("SELECT id, webhook_id FROM repos WHERE user_id=? AND full_name=?", uid, full);
        try {
            if (enable) {
                Long hook = existing.isEmpty() ? null : (Long) existing.get(0).get("webhook_id");
                if (hook == null) {
                    hook = github.createHook(token, full, props.publicUrl + "/webhooks/github", props.webhookSecret);
                }
                jdbc.update("""
                        INSERT INTO repos(user_id, full_name, webhook_id, enabled) VALUES (?,?,?,TRUE)
                        ON CONFLICT (user_id, full_name) DO UPDATE SET webhook_id=EXCLUDED.webhook_id, enabled=TRUE""", uid, full, hook);
            } else if (!existing.isEmpty()) {
                Object hook = existing.get(0).get("webhook_id");
                if (hook != null) {
                    try { github.deleteHook(token, full, ((Number) hook).longValue()); } catch (RuntimeException ignored) { }
                }
                jdbc.update("UPDATE repos SET enabled=FALSE, webhook_id=NULL WHERE user_id=? AND full_name=?", uid, full);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(502).body(Map.of("error", "GitHub refused: " + e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("fullName", full, "enabled", enable));
    }

    private String token(Long uid) {
        return crypto.decrypt(jdbc.queryForObject("SELECT token_enc FROM users WHERE id=?", String.class, uid));
    }
}
