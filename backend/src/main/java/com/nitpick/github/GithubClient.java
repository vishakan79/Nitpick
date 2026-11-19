package com.nitpick.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.config.Props;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class GithubClient {
    private final Props props;

    public GithubClient(Props props) {
        this.props = props;
    }

    private static SimpleClientHttpRequestFactory factory() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(10_000);
        f.setReadTimeout(30_000);
        return f;
    }

    private RestClient api(String token) {
        RestClient.Builder b = RestClient.builder()
                .requestFactory(factory())
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeader("User-Agent", "nitpick");
        if (token != null) {
            b.defaultHeader("Authorization", "Bearer " + token);
        }
        return b.build();
    }

    public String exchangeCode(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", props.githubClientId);
        form.add("client_secret", props.githubClientSecret);
        form.add("code", code);
        form.add("redirect_uri", props.publicUrl + "/auth/github/callback");
        JsonNode r = RestClient.builder()
                .requestFactory(factory())
                .build()
                .post()
                .uri("https://github.com/login/oauth/access_token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .header("Accept", "application/json")
                .body(form)
                .retrieve()
                .body(JsonNode.class);
        String token = r == null ? null : r.path("access_token").asText(null);
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("GitHub did not return an access token");
        }
        return token;
    }

    public JsonNode user(String token) {
        return api(token).get().uri("/user").retrieve().body(JsonNode.class);
    }

    public JsonNode primaryEmail(String token) {
        try {
            return api(token).get().uri("/user/emails").retrieve().body(JsonNode.class);
        } catch (Exception e) {
            return null;
        }
    }

    public JsonNode listRepos(String token) {
        return api(token).get()
                .uri("/user/repos?per_page=100&sort=pushed&affiliation=owner")
                .retrieve().body(JsonNode.class);
    }

    public long createHook(String token, String repo, String url, String secret) {
        Map<String, Object> body = Map.of(
                "name", "web",
                "active", true,
                "events", List.of("pull_request"),
                "config", Map.of("url", url, "content_type", "json", "secret", secret, "insecure_ssl", "0"));
        JsonNode r = api(token).post().uri("/repos/" + repo + "/hooks")
                .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(JsonNode.class);
        return r.path("id").asLong();
    }

    public void deleteHook(String token, String repo, long hookId) {
        api(token).delete().uri("/repos/" + repo + "/hooks/" + hookId).retrieve().toBodilessEntity();
    }

    public JsonNode pullFiles(String token, String repo, int number) {
        return api(token).get().uri("/repos/" + repo + "/pulls/" + number + "/files?per_page=100")
                .retrieve().body(JsonNode.class);
    }

    public void postReview(String token, String repo, int number, String sha, String body, List<Map<String, Object>> comments) {
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("commit_id", sha);
        payload.put("body", body);
        payload.put("event", "COMMENT");
        payload.put("comments", comments);
        api(token).post().uri("/repos/" + repo + "/pulls/" + number + "/reviews")
                .contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().toBodilessEntity();
    }

    public void postIssueComment(String token, String repo, int number, String body) {
        api(token).post().uri("/repos/" + repo + "/issues/" + number + "/comments")
                .contentType(MediaType.APPLICATION_JSON).body(Map.of("body", body)).retrieve().toBodilessEntity();
    }

    public void setStatus(String token, String repo, String sha, String state, String description) {
        api(token).post().uri("/repos/" + repo + "/statuses/" + sha)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("state", state, "context", "nitpick", "description", description))
                .retrieve().toBodilessEntity();
    }
}
