package com.nitpick.review;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Records a pull request and queues a review job for it. Shared by the webhook and the missed-PR sweep. */
@Service
public class PullQueue {
    private final JdbcTemplate jdbc;

    public PullQueue(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void enqueue(long repoId, int number, String title, String author, String headSha) {
        Long pullId = jdbc.queryForObject("""
                INSERT INTO pulls(repo_id, number, title, author, head_sha, status)
                VALUES (?,?,?,?,?,'queued')
                ON CONFLICT (repo_id, number) DO UPDATE SET title=EXCLUDED.title, head_sha=EXCLUDED.head_sha, status='queued', created_at=now()
                RETURNING id""", Long.class, repoId, number, title, author, headSha);
        jdbc.update("INSERT INTO jobs(pull_id) VALUES (?)", pullId);
    }
}
