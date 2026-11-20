package com.nitpick.review;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nitpick.ai.DiffChunker;
import com.nitpick.ai.ReviewParser;
import com.nitpick.ai.ReviewParser.Finding;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ReviewLogicTest {
    private static final String PATCH = String.join("\n",
            "@@ -10,3 +10,11 @@ class UserRepo {",
            " public class UserRepo {",
            "+    ResultSet byName(String name) throws SQLException {",
            "+        String sql = \"SELECT * FROM users WHERE name = '\" + name + \"'\";",
            "+        return conn.createStatement().executeQuery(sql);",
            "+    }",
            "+    List<String> emails(List<Integer> ids) throws SQLException {",
            "+        for (int id : ids) {",
            "+            rs = conn.createStatement().executeQuery(\"SELECT email FROM users WHERE id=\" + id);",
            "+        }",
            "+    }",
            " }");

    @Test
    void scannerFindsSqlInjectionAndNPlusOneInAddedCode() {
        var chunks = DiffChunker.chunk(PATCH, 5000);
        assertEquals(1, chunks.size());
        List<Finding> found = StaticRuleScanner.scan(chunks.get(0).text());
        assertTrue(found.stream().anyMatch(f -> f.category().equals("SQL injection") && f.severity().equals("critical")));
        assertTrue(found.stream().anyMatch(f -> f.category().equals("N+1 query") && f.severity().equals("warning")));
        assertTrue(chunks.get(0).addedLines().containsAll(found.stream().map(Finding::line).toList()));
    }

    @Test
    void scannerStaysQuietOnSafeCode() {
        String safe = String.join("\n",
                "@@ -1,1 +1,4 @@",
                " class A {",
                "+    ResultSet byName(String name) throws SQLException {",
                "+        PreparedStatement ps = conn.prepareStatement(\"SELECT * FROM users WHERE name = ?\");",
                "+    }");
        assertTrue(StaticRuleScanner.scan(DiffChunker.chunk(safe, 5000).get(0).text()).isEmpty());
    }

    @Test
    void parserIgnoresLinesThatAreNotInTheDiffAndSurvivesGarbage() {
        String json = "{\"findings\":[{\"line\":3,\"severity\":\"warning\",\"category\":\"Bug\",\"message_en\":\"x\",\"message_ta\":\"y\"},"
                + "{\"line\":500,\"severity\":\"critical\",\"category\":\"Bug\",\"message_en\":\"nope\"}]}";
        List<Finding> f = ReviewParser.parse(json, Set.of(3));
        assertEquals(1, f.size());
        assertEquals("warning", f.get(0).severity());
        assertTrue(ReviewParser.parse("not json at all", Set.of(3)).isEmpty());
        assertTrue(ReviewParser.parse("{\"findings\": \"oops\"}", Set.of(3)).isEmpty());
        assertTrue(ReviewParser.parse(null, Set.of(3)).isEmpty());
    }

    @Test
    void strictnessFiltersSeverities() {
        assertTrue(ReviewService.allowed("light", "critical"));
        assertFalse(ReviewService.allowed("light", "warning"));
        assertTrue(ReviewService.allowed("balanced", "warning"));
        assertTrue(ReviewService.allowed("strict", "suggestion"));
    }

    @Test
    void sweepOnlyQueuesFreshPullsTouchedAfterEnabling() {
        Instant now = Instant.parse("2026-11-20T10:00:00Z");
        Instant enabled = now.minus(Duration.ofHours(5));
        assertTrue(PullSyncService.worthQueueing(now.minus(Duration.ofMinutes(30)), enabled, now));
        assertFalse(PullSyncService.worthQueueing(enabled.minus(Duration.ofHours(1)), enabled, now), "before enabling");
        assertFalse(PullSyncService.worthQueueing(now.minus(Duration.ofHours(30)), now.minus(Duration.ofDays(5)), now), "older than a day");
    }
}
