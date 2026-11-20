package com.nitpick.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nitpick.config.Props;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebhookController {
    private final Props props;
    private final JdbcTemplate jdbc;
    private final com.nitpick.review.PullQueue queue;
    private final ObjectMapper mapper = new ObjectMapper();

    public WebhookController(Props props, JdbcTemplate jdbc, com.nitpick.review.PullQueue queue) {
        this.props = props;
        this.jdbc = jdbc;
        this.queue = queue;
    }

    @PostMapping("/webhooks/github")
    public ResponseEntity<Map<String, String>> receive(
            @RequestBody byte[] body,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String sig,
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestHeader(value = "X-GitHub-Delivery", required = false) String delivery) throws Exception {
        if (!SignatureVerifier.verify(props.webhookSecret, body, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "bad signature"));
        }
        if ("ping".equals(event)) {
            return ResponseEntity.ok(Map.of("status", "pong"));
        }
        if (!"pull_request".equals(event)) {
            return ResponseEntity.ok(Map.of("status", "ignored"));
        }
        JsonNode root = mapper.readTree(body);
        String action = root.path("action").asText("");
        if (!List.of("opened", "synchronize", "reopened").contains(action)) {
            return ResponseEntity.ok(Map.of("status", "ignored"));
        }
        if (delivery != null) {
            int fresh = jdbc.update("INSERT INTO webhook_deliveries(delivery_id) VALUES (?) ON CONFLICT DO NOTHING", delivery);
            if (fresh == 0) {
                return ResponseEntity.ok(Map.of("status", "duplicate"));
            }
        }
        String repoName = root.path("repository").path("full_name").asText("");
        JsonNode pr = root.path("pull_request");
        int number = pr.path("number").asInt();
        List<Long> repoIds = jdbc.queryForList("SELECT id FROM repos WHERE full_name=? AND enabled=TRUE", Long.class, repoName);
        for (Long repoId : repoIds) {
            queue.enqueue(repoId, number, pr.path("title").asText(""), pr.path("user").path("login").asText(""),
                    pr.path("head").path("sha").asText(""));
        }
        return ResponseEntity.accepted().body(Map.of("status", "queued"));
    }
}
