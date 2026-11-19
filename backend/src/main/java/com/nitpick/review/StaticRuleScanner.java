package com.nitpick.review;

import com.nitpick.ai.ReviewParser.Finding;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic checks for high-confidence security and performance defects.
 * These supplement Groq; they are deliberately narrow to avoid noisy findings.
 */
public final class StaticRuleScanner {
    private static final Pattern ADDED_LINE = Pattern.compile("^L(\\d+)\\+\\s?(.*)$");
    private static final Pattern SQL_KEYWORD = Pattern.compile(
            "(?i)\\b(SELECT|INSERT\\s+INTO|UPDATE\\s+\\w+|DELETE\\s+FROM)\\b");
    private static final Pattern CONCATENATED_VALUE = Pattern.compile(
            "(?:\\"|')\\s*\\+\\s*[A-Za-z_$][A-Za-z0-9_$]*");
    private static final Pattern LOOP = Pattern.compile("\\b(for|while)\\s*\\(");
    private static final Pattern DATABASE_CALL = Pattern.compile(
            "(?i)(\\.executeQuery\\s*\\(|\\.executeUpdate\\s*\\(|\\.queryFor(List|Object|Map)\\s*\\(|\\bjdbc\\.query\\s*\\(|\\.(findBy|getBy|findAll|loadBy)\\w*\\s*\\()");
    
    private StaticRuleScanner() {}

    public static List<Finding> scan(String labelledDiff) {
        List<Finding> findings = new ArrayList<>();
        if (labelledDiff == null || labelledDiff.isBlank()) return findings;

        int braceDepth = 0;
        Deque<Integer> loopDepths = new ArrayDeque<>();
        boolean oneLineLoop = false;

        for (String raw : labelledDiff.split("\\R")) {
            Matcher lineMatcher = ADDED_LINE.matcher(raw);
            if (!lineMatcher.matches()) continue;

            int lineNumber = Integer.parseInt(lineMatcher.group(1));
            String code = lineMatcher.group(2);
            String masked = maskStringsAndComments(code);

            if (SQL_KEYWORD.matcher(code).find() && CONCATENATED_VALUE.matcher(code).find()) {
                findings.add(new Finding(
                        lineNumber,
                        "critical",
                        "SQL injection",
                        "SQL is constructed by concatenating a variable into a query. If that value comes from a user or request, an attacker can change the SQL that runs.",
                        "SQL query-ah variable-oda string join panni build pannirukkinga. User input vandha attacker query-ah maatha mudiyum.",
                        "Use a PreparedStatement with ? placeholders and bind each value with setString/setInt; do not concatenate values into SQL."));
            }

            boolean startsLoop = LOOP.matcher(masked).find();
            int opens = count(masked, '{');
            int closes = count(masked, '}');
            if (startsLoop && opens <= closes) {
                oneLineLoop = true;
            } else if (startsLoop && opens > closes) {
                braceDepth += opens - closes;
                loopDepths.push(braceDepth);
                oneLineLoop = false;
            } else {
                braceDepth = Math.max(0, braceDepth + opens - closes);
            }

            boolean insideLoop = oneLineLoop || !loopDepths.isEmpty();
            if (insideLoop && DATABASE_CALL.matcher(masked).find()) {
                findings.add(new Finding(
                        lineNumber,
                        "warning",
                        "N+1 query",
                        "A database query runs inside a loop, so the application can issue one query per item. This causes N+1 query behaviour as the list grows.",
                        "Loop-kulla database query run aagudhu. List perusa aana ovvoru item-kum separate query pogum; idhu N+1 performance problem.",
                        "Fetch the required rows in one batched query using an IN clause, JOIN, or repository batch method, then map the results in memory."));
            }

            // A one-line loop has no enclosing braces, so it applies only to this line.
            oneLineLoop = false;
            while (!loopDepths.isEmpty() && braceDepth < loopDepths.peek()) {
                loopDepths.pop();
            }
        }
        return findings;
    }

    private static int count(String value, char target) {
        int n = 0;
        for (int i = 0; i < value.length(); i++) if (value.charAt(i) == target) n++;
        return n;
    }

    /** Blanks literals and comments before counting braces or matching loop/query syntax. */
    private static String maskStringsAndComments(String source) {
        StringBuilder out = new StringBuilder(source.length());
        boolean single = false, dbl = false, lineComment = false, blockComment = false, escaped = false;
        for (int i = 0; i < source.length(); i++) {
            char ch = source.charAt(i);
            char next = i + 1 < source.length() ? source.charAt(i + 1) : '\\0';
            if (lineComment) {
                out.append(' ');
                continue;
            }
            if (blockComment) {
                if (ch == '*' && next == '/') {
                    out.append("  ");
                    i++;
                    blockComment = false;
                } else out.append(' ');
                continue;
            }
            if (!single && !dbl && ch == '/' && next == '/') {
                out.append("  ");
                i++;
                lineComment = true;
                continue;
            }
            if (!single && !dbl && ch == '/' && next == '*') {
                out.append("  ");
                i++;
                blockComment = true;
                continue;
            }
            if (escaped) {
                out.append(' ');
                escaped = false;
                continue;
            }
            if ((single || dbl) && ch == '\\\\') {
                out.append(' ');
                escaped = true;
                continue;
            }
            if (!dbl && ch == '\\'') {
                single = !single;
                out.append(' ');
                continue;
            }
            if (!single && ch == '"') {
                dbl = !dbl;
                out.append(' ');
                continue;
            }
            out.append(single || dbl ? ' ' : ch);
        }
        return out.toString();
    }
}
