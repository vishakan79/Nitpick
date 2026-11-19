package com.nitpick;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nitpick.ai.DiffChunker;
import com.nitpick.ai.ReviewParser;
import com.nitpick.api.SignatureVerifier;
import com.nitpick.review.ReviewService;
import com.nitpick.review.StaticRuleScanner;
import com.nitpick.security.CryptoService;
import com.nitpick.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CoreTest {

    @Test
    void signatureMatchesAndRejectsTampering() {
        byte[] body = "{\"a\":1}".getBytes(StandardCharsets.UTF_8);
        String sig = SignatureVerifier.sign("secret", body);
        assertTrue(SignatureVerifier.verify("secret", body, sig));
        assertFalse(SignatureVerifier.verify("other", body, sig));
        assertFalse(SignatureVerifier.verify("secret", "{}".getBytes(StandardCharsets.UTF_8), sig));
        assertFalse(SignatureVerifier.verify("secret", body, null));
    }

    @Test
    void chunkerNumbersAddedLines() {
        String patch = "@@ -1,2 +1,3 @@\n a\n+b\n c";
        var chunks = DiffChunker.chunk(patch, 1000);
        assertEquals(1, chunks.size());
        assertEquals(Set.of(2), chunks.get(0).addedLines());
        assertTrue(chunks.get(0).text().contains("L2+ b"));
    }

    @Test
    void parserKeepsOnlyValidLines() {
        String json = "```json\n{\"findings\":[{\"line\":2,\"severity\":\"Critical\",\"category\":\"SQL\",\"message_en\":\"bad\",\"message_ta\":\"mosam\",\"fix\":\"x\"},"
                + "{\"line\":99,\"severity\":\"warning\",\"category\":\"X\",\"message_en\":\"nope\"}]}\n```";
        var f = ReviewParser.parse(json, Set.of(2));
        assertEquals(1, f.size());
        assertEquals("critical", f.get(0).severity());
    }

    @Test
    void jwtRoundTripAndPurpose() {
        JwtService j = new JwtService("0123456789012345678901234567890123456789");
        String t = j.issue("42", "session", Duration.ofMinutes(5));
        assertEquals("42", j.verify(t, "session"));
        assertNull(j.verify(t, "state"));
        assertNull(j.verify(t + "x", "session"));
    }

    @Test
    void cryptoRoundTrip() {
        CryptoService c = new CryptoService("a-long-enough-secret-key");
        String enc = c.encrypt("gho_token");
        assertFalse(enc.contains("gho_token"));
        assertEquals("gho_token", c.decrypt(enc));
    }


    @Test
    void reviewSeverityPolicyIncludesActionableBalancedSuggestions() {
        assertTrue(ReviewService.allowed("balanced", "critical"));
        assertTrue(ReviewService.allowed("balanced", "warning"));
        assertTrue(ReviewService.allowed("balanced", "suggestion"));
        assertFalse(ReviewService.allowed("light", "warning"));
        assertFalse(ReviewService.allowed("light", "suggestion"));
        assertTrue(ReviewService.allowed("strict", "suggestion"));
    }

    @Test
    void deterministicScannerFlagsSqlInjectionAndNPlusOneQueries() {
        String diff = """
                @@ -0,0 +1,5 @@
                L10+ String sql = "SELECT * FROM users WHERE name = '" + name + "'";
                L11  for (int id : ids) {
                L12+ ResultSet rs = connection.createStatement().executeQuery("SELECT email FROM users WHERE id = " + id);
                L13  }
                """;
        var findings = StaticRuleScanner.scan(diff);
        assertEquals(3, findings.size());
        assertEquals(10, findings.get(0).line());
        assertEquals("critical", findings.get(0).severity());
        assertEquals("SQL injection", findings.get(0).category());
        assertEquals(12, findings.get(1).line());
        assertEquals("critical", findings.get(1).severity());
        assertEquals("SQL injection", findings.get(1).category());
        assertEquals(12, findings.get(2).line());
        assertEquals("warning", findings.get(2).severity());
        assertEquals("N+1 query", findings.get(2).category());
    }

    @Test
    void deterministicScannerDoesNotFlagParameterizedSql() {
        String diff = """
                @@ -0,0 +1,2 @@
                L1+ PreparedStatement statement = connection.prepareStatement("SELECT * FROM users WHERE id = ?");
                L2+ statement.setInt(1, id);
                """;
        assertTrue(StaticRuleScanner.scan(diff).isEmpty());
    }

    @Test
    void scoreIsClamped() {
        assertEquals(100, ReviewService.score(0, 0, 0));
        assertEquals(0, ReviewService.score(10, 0, 0));
    }
}
