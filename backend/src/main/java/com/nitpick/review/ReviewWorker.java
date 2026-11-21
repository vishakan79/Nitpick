package com.nitpick.review;

import com.nitpick.messaging.ReviewBroker;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs review jobs. RabbitMQ delivers job ids as soon as they are queued; the Postgres poll
 * (FOR UPDATE SKIP LOCKED) stays as the fallback and as a slow safety net while the broker is up.
 */
@Component
public class ReviewWorker {
    private static final Logger log = LoggerFactory.getLogger(ReviewWorker.class);
    private static final int MAX_ATTEMPTS = 3;
    private static final int SAFETY_NET_EVERY = 10; // polls (3s each) while RabbitMQ is active

    private final JdbcTemplate jdbc;
    private final ReviewService reviews;
    private final ReviewBroker broker;
    private int tick;

    public ReviewWorker(JdbcTemplate jdbc, ReviewService reviews, ReviewBroker broker) {
        this.jdbc = jdbc;
        this.reviews = reviews;
        this.broker = broker;
    }

    @PostConstruct
    void registerWithBroker() {
        broker.setHandler(this::runJob);
    }

    @Scheduled(fixedDelay = 3000, initialDelay = 10000)
    public void poll() {
        if (broker.active() && ++tick % SAFETY_NET_EVERY != 0) return;
        try {
            jdbc.update("UPDATE jobs SET status='queued' WHERE status='running' AND locked_at < now() - interval '10 minutes'");
            List<Map<String, Object>> claimed = jdbc.queryForList("""
                    UPDATE jobs SET status='running', attempts=attempts+1, locked_at=now()
                    WHERE id = (SELECT id FROM jobs WHERE status='queued' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
                    RETURNING id, pull_id, attempts""");
            if (!claimed.isEmpty()) process(claimed.get(0));
        } catch (Exception e) {
            log.error("Worker poll failed: {}", e.getMessage());
        }
    }

    /** Called by the RabbitMQ consumer. A job that is no longer queued (already taken by the poller) is skipped. */
    public void runJob(long jobId) {
        try {
            List<Map<String, Object>> claimed = jdbc.queryForList("""
                    UPDATE jobs SET status='running', attempts=attempts+1, locked_at=now()
                    WHERE id=? AND status='queued'
                    RETURNING id, pull_id, attempts""", jobId);
            if (!claimed.isEmpty()) process(claimed.get(0));
        } catch (Exception e) {
            log.error("Job {} could not be started: {}", jobId, e.getMessage());
        }
    }

    private void process(Map<String, Object> job) {
        long jobId = ((Number) job.get("id")).longValue();
        long pullId = ((Number) job.get("pull_id")).longValue();
        int attempts = ((Number) job.get("attempts")).intValue();
        try {
            reviews.review(pullId);
            // Keep the pull-request state consistent with a successfully completed job.
            jdbc.update(
                    "UPDATE pulls SET status='reviewed', reviewed_at=COALESCE(reviewed_at, now()) WHERE id=? AND status IN ('queued','running')",
                    pullId);
            jdbc.update("UPDATE jobs SET status='done', error=NULL WHERE id=?", jobId);
        } catch (Exception e) {
            String msg = String.valueOf(e.getMessage());
            log.error("Review job {} failed (attempt {}): {}", jobId, attempts, msg);
            if (attempts >= MAX_ATTEMPTS) {
                jdbc.update("UPDATE jobs SET status='failed', error=? WHERE id=?", msg, jobId);
                jdbc.update("UPDATE pulls SET status='failed' WHERE id=?", pullId);
                broker.deadLetter(jobId);
            } else {
                // The poll picks it up again, so retries never depend on the broker.
                jdbc.update("UPDATE jobs SET status='queued', error=? WHERE id=?", msg, jobId);
                jdbc.update("UPDATE pulls SET status='queued' WHERE id=?", pullId);
            }
        }
    }
}
