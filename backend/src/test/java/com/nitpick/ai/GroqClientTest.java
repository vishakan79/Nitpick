package com.nitpick.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class GroqClientTest {

    @Test
    void modelChainKeepsOrderAndRemovesDuplicates() {
        assertEquals(List.of("a/x", "b/y"), GroqClient.modelChain("a/x", " b/y , a/x ,, "));
        assertEquals(List.of("a/x"), GroqClient.modelChain("a/x", null));
        assertEquals(List.of("b/y"), GroqClient.modelChain("", "b/y"));
    }

    @Test
    void retiredModelsAreDetected() {
        assertTrue(GroqClient.modelUnavailable(404, "The model `x` does not exist"));
        assertTrue(GroqClient.modelUnavailable(400, "{\"error\":{\"code\":\"model_decommissioned\"}}"));
        assertTrue(GroqClient.modelUnavailable(400, "{\"error\":{\"code\":\"model_not_found\"}}"));
        assertFalse(GroqClient.modelUnavailable(400, "{\"error\":{\"code\":\"json_validate_failed\"}}"));
        assertFalse(GroqClient.modelUnavailable(401, "invalid api key"));
        assertFalse(GroqClient.modelUnavailable(429, "rate limited"));
    }

    @Test
    void jsonRejectionIsDetected() {
        assertTrue(GroqClient.jsonRejected(400, "{\"error\":{\"code\":\"json_validate_failed\"}}"));
        assertFalse(GroqClient.jsonRejected(400, "something else"));
        assertFalse(GroqClient.jsonRejected(500, "json_validate_failed"));
        assertFalse(GroqClient.jsonRejected(400, null));
    }

    @Test
    void requestBodyAddsReasoningOnlyForGptOssAndJsonOnlyWhenAsked() {
        Map<String, Object> oss = GroqClient.requestBody("openai/gpt-oss-120b", "sys", "usr", true);
        assertEquals("low", oss.get("reasoning_effort"));
        assertEquals(4096, oss.get("max_completion_tokens"));
        assertEquals(Map.of("type", "json_object"), oss.get("response_format"));

        Map<String, Object> other = GroqClient.requestBody("meta/other", "sys", "usr", false);
        assertFalse(other.containsKey("reasoning_effort"));
        assertFalse(other.containsKey("response_format"));
        assertEquals(2, ((List<?>) other.get("messages")).size());
    }
}
