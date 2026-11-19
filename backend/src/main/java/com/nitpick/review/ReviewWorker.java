package com.nitpick.review;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Polls the jobs table (Postgres as the queue, FOR UPDATE SKIP LOCKED) and runs reviews one at a time. */
@Component
public class ReviewWorker {
    private static final Logger log = LoggerFactory.getLogger(ReviewWorker.class);
    private static final int MAX_ATTEMPTS = 3;

    private final JdbcTemplate jdbc;
    private final ReviewService reviews;

    public ReviewWorker(JdbcTemplate jdbc, ReviewService reviews) {
        this.jdbc = jdbc;
        this.reviews = reviews;
    }

    @Scheduled(fixedDelay = 3000, initialDelay = 10000)
    public void poll() {
        try {
            jdbc.update("UPDATE jobs SET status='queued' WHERE status='running' AND locked_at < now() - interval '10 minutes'");
            List<Map<String, Object>> claimed = jdbc.queryForList("""
                    UPDATE jobs SET status='running', attempts=attempts+1, locked_at=now()
                    WHERE id = (SELECT id FROM jobs WHERE status='queued' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
                    RETURNING id, pull_id, attempts""");
            if (claimed.isEmpty()) return;
            Map<String, Object> job = claimed.get(0);
            long jobId = ((Number) job.get("id")).longValue();
            long pullId = ((Number) job.get("pull_id")).longValue();
            int attempts = ((Number) job.get("attempts")).intValue();
            try {
                reviews.review(pullId);
                jdbc.update("UPDATE jobs SET status='done', error=NULL WHERE id=?", jobId);
            } catch (Exception e) {
                String msg = String.valueOf(e.getMessage());
                log.error("Review job {} failed (attempt {}): {}", jobId, attempts, msg);
                if (attempts >= MAX_ATTEMPTS) {
                    jdbc.update("UPDATE jobs SET status='failed', error=? WHERE id=?", msg, jobId);
                    jdbc.update("UPDATE pulls SET status='failed' WHERE id=?", pullId);
                } else {
                    jdbc.update("UPDATE jobs SET status='queued', error=? WHERE id=?", msg, jobId);
                    jdbc.update("UPDATE pulls SET status='queued' WHERE id=?", pullId);
                }
            }
        } catch (Exception e) {
            log.error("Worker poll failed: {}", e.getMessage());
        }
    }
}
