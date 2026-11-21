package com.nitpick.review;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.ai.DiffChunker;
import com.nitpick.ai.GroqClient;
import com.nitpick.ai.ReviewParser;
import com.nitpick.ai.ReviewParser.Finding;
import com.nitpick.github.GithubClient;
import com.nitpick.security.CryptoService;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {
    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);
    private static final int MAX_FILES = 8;
    private static final int MAX_CHUNKS = 5;
    private static final int CHUNK_CHARS = 5000;

    private final JdbcTemplate jdbc;
    private final GithubClient github;
    private final GroqClient groq;
    private final CryptoService crypto;

    public ReviewService(JdbcTemplate jdbc, GithubClient github, GroqClient groq, CryptoService crypto) {
        this.jdbc = jdbc;
        this.github = github;
        this.groq = groq;
        this.crypto = crypto;
    }

    public static int score(int critical, int warnings, int tips) {
        return Math.max(0, 100 - critical * 15 - warnings * 5 - tips);
    }

    public void review(long pullId) {
        Map<String, Object> p = jdbc.queryForMap("""
                SELECT p.id, p.number, p.head_sha, r.full_name, u.token_enc, u.lang, u.strictness, u.fail_check, u.id AS user_id
                FROM pulls p JOIN repos r ON r.id = p.repo_id JOIN users u ON u.id = r.user_id
                WHERE p.id = ?""", pullId);
        String token = crypto.decrypt((String) p.get("token_enc"));
        String repo = (String) p.get("full_name");
        int number = ((Number) p.get("number")).intValue();
        String sha = (String) p.get("head_sha");
        String lang = (String) p.get("lang");
        String strict = (String) p.get("strictness");
        long userId = ((Number) p.get("user_id")).longValue();

        jdbc.update("UPDATE pulls SET status='running' WHERE id=?", pullId);
        List<String> rules = jdbc.queryForList(
                "SELECT name || ': ' || description FROM rules WHERE user_id=? AND enabled=TRUE", String.class, userId);

        JsonNode files = github.pullFiles(token, repo, number);
        List<Object[]> rows = new ArrayList<>();
        Set<String> findingKeys = new HashSet<>();
        int fileCount = 0;
        int chunkCount = 0;
        if (files != null && files.isArray()) {
            for (JsonNode f : files) {
                if (fileCount >= MAX_FILES || chunkCount >= MAX_CHUNKS) break;
                String patch = f.path("patch").asText(null);
                String name = f.path("filename").asText("");
                if (patch == null || skip(name)) continue;
                fileCount++;
                for (DiffChunker.Chunk c : DiffChunker.chunk(patch, CHUNK_CHARS)) {
                    if (chunkCount >= MAX_CHUNKS) break;
                    if (chunkCount > 0) sleep(2500);
                    chunkCount++;
                    String content;
                    try {
                        content = groq.complete(systemPrompt(strict, rules), "File: " + name + "\n\n" + c.text());
                    } catch (RuntimeException e) {
                        log.warn("Groq call failed for {}: {}", name, e.getMessage());
                        throw e;
                    }
                    for (Finding fd : ReviewParser.parse(content, c.addedLines())) {
                        if (!allowed(strict, fd.severity())) continue;
                        String key = findingKey(name, fd);
                        if (findingKeys.add(key)) {
                            rows.add(new Object[] {pullId, name, fd.line(), fd.severity(), fd.category(), fd.en(), fd.ta(), fd.fix()});
                        }
                    }
                    // Deterministic checks catch high-confidence security/performance issues
                    // even when the language model overlooks an obvious pattern.
                    for (Finding fd : StaticRuleScanner.scan(c.text())) {
                        if (!allowed(strict, fd.severity())) continue;
                        String key = findingKey(name, fd);
                        if (findingKeys.add(key)) {
                            rows.add(new Object[] {pullId, name, fd.line(), fd.severity(), fd.category(), fd.en(), fd.ta(), fd.fix()});
                        }
                    }
                }
            }
        }

        jdbc.update("DELETE FROM findings WHERE pull_id=?", pullId);
        for (Object[] r : rows) {
            jdbc.update("INSERT INTO findings(pull_id,file,line,severity,category,message_en,message_ta,fix) VALUES (?,?,?,?,?,?,?,?)", r);
        }
        int crit = 0, warn = 0, tip = 0;
        for (Object[] r : rows) {
            String s = (String) r[3];
            if (s.equals("critical")) crit++;
            else if (s.equals("warning")) warn++;
            else tip++;
        }
        int score = score(crit, warn, tip);
        String summary = "Nitpick reviewed " + fileCount + " file(s): " + crit + " critical, " + warn + " warnings, " + tip
                + " suggestions. Score " + score + "/100.";
        jdbc.update("UPDATE pulls SET status='reviewed', score=?, critical=?, warnings=?, tips=?, summary=?, reviewed_at=now() WHERE id=?",
                score, crit, warn, tip, summary, pullId);

        postToGithub(token, repo, number, sha, lang, summary, rows);
        if (Boolean.TRUE.equals(p.get("fail_check")) && sha != null) {
            try {
                github.setStatus(token, repo, sha, crit > 0 ? "failure" : "success",
                        crit > 0 ? crit + " critical issue(s) found" : "No critical issues");
            } catch (RuntimeException e) {
                log.warn("Status check failed: {}", e.getMessage());
            }
        }
    }

    private void postToGithub(String token, String repo, int number, String sha, String lang, String summary, List<Object[]> rows) {
        List<Map<String, Object>> comments = new ArrayList<>();
        for (Object[] r : rows) {
            String msg = (String) r[5];
            String fix = (String) r[7];
            StringBuilder body = new StringBuilder("**").append(label((String) r[3])).append(": ").append(r[4]).append("**\n\n").append(msg);
            if (fix != null && !fix.isBlank()) body.append("\n\n**Fix:** ").append(fix);
            comments.add(Map.of("path", r[1], "line", r[2], "side", "RIGHT", "body", body.toString()));
        }
        try {
            github.postReview(token, repo, number, sha, summary, comments);
        } catch (RuntimeException e) {
            log.warn("Inline review failed ({}), falling back to a single comment", e.getMessage());
            StringBuilder sb = new StringBuilder(summary).append("\n\n");
            for (Object[] r : rows) {
                sb.append("- `").append(r[1]).append(":").append(r[2]).append("` ").append(label((String) r[3])).append(": ")
                        .append(r[5]).append('\n');
            }
            github.postIssueComment(token, repo, number, sb.toString());
        }
    }

    private static String findingKey(String file, Finding finding) {
        return file + ":" + finding.line() + ":" + finding.category().trim().toLowerCase(java.util.Locale.ROOT);
    }

    static String label(String sev) {
        return switch (sev) {
            case "critical" -> "Critical";
            case "warning" -> "Warning";
            default -> "Suggestion";
        };
    }

    public static boolean allowed(String strictness, String sev) {
        if ("light".equals(strictness)) return sev.equals("critical");
        // Balanced reviews include actionable testing/maintainability suggestions too.
        // The prompt explicitly excludes cosmetic/style-only nitpicks at this level.
        return true;
    }

    private static boolean skip(String name) {
        String n = name.toLowerCase();
        return n.endsWith(".lock") || n.endsWith("package-lock.json") || n.endsWith(".min.js") || n.endsWith(".svg")
                || n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".md") || n.contains("/dist/") || n.contains("node_modules/");
    }

    private static String systemPrompt(String strict, List<String> rules) {
        String level = "light".equals(strict) ? "Report only critical bugs and security holes."
                : "strict".equals(strict) ? "Report bugs, security, performance, tests and style issues."
                : "Report bugs, security issues, performance problems, and actionable testing or maintainability gaps. Skip cosmetic/style-only nitpicks.";
        StringBuilder sb = new StringBuilder();
        sb.append("You are Nitpick, a precise senior code reviewer. You receive part of a pull request diff. ")
                .append("Each line starts with its line number in the new file: 'L12+ code' is an added line, 'L12  code' is unchanged context, '   - code' is removed. ")
                .append("Only comment on added lines (marked +) and use exactly their number. ").append(level)
                .append(" Never invent problems. If the code is fine return an empty list. At most 6 findings.\n");
        if (!rules.isEmpty()) {
            sb.append("Team rules to also enforce:\n");
            for (String r : rules) sb.append("- ").append(r).append('\n');
        }
        sb.append("Reply with JSON only: {\"findings\":[{\"line\":12,\"severity\":\"critical|warning|suggestion\",")
                .append("\"category\":\"short name like SQL injection\",\"message_en\":\"clear explanation in 1-2 sentences\",")
                .append("\"fix\":\"short corrected code or advice\"}]}");
        return sb.toString();
    }

    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
