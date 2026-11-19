package com.nitpick.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.config.Props;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Service
public class GroqClient {
    private final Props props;
    private final RestClient client;

    public GroqClient(Props props) {
        this.props = props;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(10_000);
        f.setReadTimeout(60_000);
        this.client = RestClient.builder().requestFactory(f).baseUrl("https://api.groq.com/openai/v1").build();
    }

    /** Sends one chat completion and returns the message content. Retries on rate limits. */
    public String complete(String system, String user) {
        if (props.groqApiKey == null || props.groqApiKey.isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY is not set");
        }
        Map<String, Object> body = Map.of(
                "model", props.groqModel,
                "temperature", 0.1,
                "max_tokens", 1500,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)));
        for (int attempt = 0; ; attempt++) {
            try {
                JsonNode r = client.post().uri("/chat/completions")
                        .header("Authorization", "Bearer " + props.groqApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body).retrieve().body(JsonNode.class);
                return r.path("choices").path(0).path("message").path("content").asText("");
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt >= 3) throw e;
                long wait = 8_000L * (attempt + 1);
                String h = e.getResponseHeaders() == null ? null : e.getResponseHeaders().getFirst("retry-after");
                if (h != null) {
                    try { wait = Math.min(60_000L, (long) (Double.parseDouble(h) * 1000) + 500); } catch (NumberFormatException ignored) { }
                }
                try { Thread.sleep(wait); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw e; }
            }
        }
    }
}
