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
    private static final Pattern DIFF_LINE = Pattern.compile("^L(\\d+)(\\+|  )\\s?(.*)$");
    private static final Pattern SQL_KEYWORD = Pattern.compile(
            "(?i)\\b(SELECT|INSERT\\s+INTO|UPDATE\\s+\\w+|DELETE\\s+FROM)\\b");
    private static final Pattern CONCATENATED_VALUE = Pattern.compile(
            "\\+\\s*[A-Za-z_$][A-Za-z0-9_$]*");
    private static final Pattern LOOP = Pattern.compile("\\b(for|while)\\s*\\(");
    private static final Pattern DATABASE_CALL = Pattern.compile(
            "(?i)(\\.executeQuery\\s*\\(|\\.executeUpdate\\s*\\(|\\.queryFor(List|Object|Map)\\s*\\(|\\bjdbc\\.query\\s*\\(|\\.(findBy|getBy|findAll|loadBy)\\w*\\s*\\()");

    private StaticRuleScanner() {}

    public static List<Finding> scan(String labelledDiff) {
        List<Finding> findings = new ArrayList<>();
        if (labelledDiff == null || labelledDiff.isBlank()) return findings;

        int braceDepth = 0;
        Deque<Integer> loopDepths = new ArrayDeque<>();
        for (String raw : labelledDiff.split("\\R")) {
            Matcher lineMatcher = DIFF_LINE.matcher(raw);
            if (!lineMatcher.matches()) continue;

            int lineNumber = Integer.parseInt(lineMatcher.group(1));
            boolean added = "+".equals(lineMatcher.group(2));
            String code = lineMatcher.group(3);

            // Only flag SQL construction on lines added in this pull request.
            if (added && code.indexOf(34) >= 0 && SQL_KEYWORD.matcher(code).find()
                    && CONCATENATED_VALUE.matcher(code).find()) {
                findings.add(new Finding(
                        lineNumber,
                        "critical",
                        "SQL injection",
                        "SQL is constructed by concatenating a variable into a query. If that value comes from a user or request, an attacker can change the SQL that runs.",
                        "SQL query-ah variable-oda string join panni build pannirukkinga. User input vandha attacker query-ah maatha mudiyum.",
                        "Use a PreparedStatement with ? placeholders and bind each value with setString/setInt; do not concatenate values into SQL."));
            }

            // Context lines matter: a new database call can be inside an unchanged loop.
            boolean startsLoop = LOOP.matcher(code).find();
            int opens = count(code, '{');
            int closes = count(code, '}');
            if (startsLoop && opens > closes) {
                braceDepth = Math.max(0, braceDepth + opens - closes);
                loopDepths.push(braceDepth);
            } else if (!startsLoop) {
                braceDepth = Math.max(0, braceDepth + opens - closes);
            }

            if (added && !loopDepths.isEmpty() && DATABASE_CALL.matcher(code).find()) {
                findings.add(new Finding(
                        lineNumber,
                        "warning",
                        "N+1 query",
                        "A database query runs inside a loop, so the application can issue one query per item. This causes N+1 query behaviour as the list grows.",
                        "Loop-kulla database query run aagudhu. List perusa aana ovvoru item-kum separate query pogum; idhu N+1 performance problem.",
                        "Fetch the required rows in one batched query using an IN clause, JOIN, or repository batch method, then map the results in memory."));
            }

            while (!loopDepths.isEmpty() && braceDepth < loopDepths.peek()) {
                loopDepths.pop();
            }
        }
        return findings;
    }

    private static int count(String value, char target) {
        int n = 0;
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) == target) n++;
        }
        return n;
    }
}
