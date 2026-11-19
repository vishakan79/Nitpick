package com.nitpick.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class ReviewParser {
    public record Finding(int line, String severity, String category, String en, String ta, String fix) {}

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ReviewParser() {}

    public static List<Finding> parse(String content, Set<Integer> validLines) {
        List<Finding> out = new ArrayList<>();
        if (content == null || content.isBlank()) {
            return out;
        }
        String json = content.trim();
        int a = json.indexOf('{');
        int b = json.lastIndexOf('}');
        if (a < 0 || b <= a) {
            return out;
        }
        json = json.substring(a, b + 1);
        try {
            JsonNode root = MAPPER.readTree(json);
            JsonNode arr = root.path("findings");
            if (!arr.isArray()) {
                return out;
            }
            for (JsonNode n : arr) {
                int line = n.path("line").asInt(-1);
                if (!validLines.contains(line)) {
                    continue;
                }
                String en = clip(n.path("message_en").asText(""), 600);
                if (en.isBlank()) {
                    continue;
                }
                String ta = clip(n.path("message_ta").asText(""), 700);
                if (ta.isBlank()) {
                    ta = en;
                }
                out.add(new Finding(
                        line,
                        severity(n.path("severity").asText("")),
                        clip(n.path("category").asText("General"), 60),
                        en,
                        ta,
                        clip(n.path("fix").asText(""), 500)));
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
        return out;
    }

    static String severity(String s) {
        String v = s == null ? "" : s.toLowerCase();
        if (v.startsWith("crit")) return "critical";
        if (v.startsWith("warn")) return "warning";
        return "suggestion";
    }

    private static String clip(String s, int max) {
        String t = s == null ? "" : s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
