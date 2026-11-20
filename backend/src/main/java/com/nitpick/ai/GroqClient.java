package com.nitpick.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.config.Props;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Service
public class GroqClient {
    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final Props props;
    private final RestClient client;

    public GroqClient(Props props) {
        this.props = props;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(10_000);
        f.setReadTimeout(90_000);
        this.client = RestClient.builder().requestFactory(f).baseUrl("https://api.groq.com/openai/v1").build();
    }

    /**
     * Sends one chat completion and returns the message content. Retries on rate limits, retries without
     * strict JSON mode when Groq rejects the model's JSON, and moves to a fallback model when a model has
     * been retired (Groq retires models regularly).
     */
    public String complete(String system, String user) {
        if (props.groqApiKey == null || props.groqApiKey.isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY is not set");
        }
        HttpClientErrorException last = null;
        for (String model : modelChain(props.groqModel, props.groqFallbackModels)) {
            try {
                return completeWith(model, system, user);
            } catch (HttpClientErrorException e) {
                if (modelUnavailable(e.getStatusCode().value(), e.getResponseBodyAsString())) {
                    log.warn("Groq model {} is unavailable ({}), trying the next one", model, e.getStatusCode().value());
                    last = e;
                    continue;
                }
                throw e;
            }
        }
        if (last != null) throw last;
        throw new IllegalStateException("No Groq model is configured");
    }

    private String completeWith(String model, String system, String user) {
        boolean jsonMode = true;
        for (int attempt = 0; ; attempt++) {
            try {
                JsonNode r = client.post().uri("/chat/completions")
                        .header("Authorization", "Bearer " + props.groqApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody(model, system, user, jsonMode)).retrieve().body(JsonNode.class);
                String content = r.path("choices").path(0).path("message").path("content").asText("");
                if (content.isBlank() && attempt < 3) {
                    // A reasoning model can spend its whole budget thinking; ask again once.
                    log.warn("Groq returned empty content for {}, retrying", model);
                    continue;
                }
                return content;
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt >= 3) throw e;
                long wait = 8_000L * (attempt + 1);
                String h = e.getResponseHeaders() == null ? null : e.getResponseHeaders().getFirst("retry-after");
                if (h != null) {
                    try { wait = Math.min(60_000L, (long) (Double.parseDouble(h) * 1000) + 500); } catch (NumberFormatException ignored) { }
                }
                try { Thread.sleep(wait); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw e; }
            } catch (HttpClientErrorException e) {
                if (jsonMode && jsonRejected(e.getStatusCode().value(), e.getResponseBodyAsString())) {
                    log.warn("Groq rejected the JSON from {}, retrying without strict JSON mode", model);
                    jsonMode = false;
                    continue;
                }
                throw e;
            }
        }
    }

    static Map<String, Object> requestBody(String model, String system, String user, boolean jsonMode) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", 0.1);
        // Reasoning models count their hidden reasoning against this budget, so keep it generous.
        body.put("max_completion_tokens", 4096);
        if (model.startsWith("openai/gpt-oss")) {
            body.put("reasoning_effort", "low");
        }
        if (jsonMode) {
            body.put("response_format", Map.of("type", "json_object"));
        }
        body.put("messages", List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", user)));
        return body;
    }

    static List<String> modelChain(String primary, String fallbacks) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (primary != null && !primary.isBlank()) out.add(primary.trim());
        if (fallbacks != null) {
            for (String m : fallbacks.split(",")) {
                if (!m.isBlank()) out.add(m.trim());
            }
        }
        return new ArrayList<>(out);
    }

    static boolean modelUnavailable(int status, String body) {
        String b = body == null ? "" : body;
        return status == 404
                || (status == 400 && (b.contains("model_not_found") || b.contains("model_decommissioned")));
    }

    static boolean jsonRejected(int status, String body) {
        return status == 400 && body != null && body.contains("json_validate_failed");
    }
}
