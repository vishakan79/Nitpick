package com.nitpick.ai;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Splits a GitHub file patch into prompt-sized chunks, labelling each line with its new-file line number. */
public final class DiffChunker {
    public record Chunk(String text, Set<Integer> addedLines) {}

    private static final Pattern HUNK = Pattern.compile("^@@ -\\d+(?:,\\d+)? \\+(\\d+)(?:,\\d+)? @@.*");

    private DiffChunker() {}

    public static List<Chunk> chunk(String patch, int maxChars) {
        List<Chunk> out = new ArrayList<>();
        if (patch == null || patch.isBlank()) {
            return out;
        }
        StringBuilder sb = new StringBuilder();
        Set<Integer> added = new HashSet<>();
        int newLine = 0;
        for (String raw : patch.split("\n")) {
            Matcher m = HUNK.matcher(raw);
            String line;
            if (m.matches()) {
                newLine = Integer.parseInt(m.group(1));
                line = raw;
            } else if (raw.startsWith("+")) {
                line = "L" + newLine + "+ " + raw.substring(1);
                added.add(newLine);
                newLine++;
            } else if (raw.startsWith("-")) {
                line = "   - " + raw.substring(1);
            } else if (raw.startsWith("\\")) {
                continue;
            } else {
                line = "L" + newLine + "  " + (raw.isEmpty() ? "" : raw.substring(1));
                newLine++;
            }
            if (sb.length() > 0 && sb.length() + line.length() + 1 > maxChars) {
                out.add(new Chunk(sb.toString(), added));
                sb = new StringBuilder();
                added = new HashSet<>();
            }
            sb.append(line).append('\n');
        }
        if (sb.length() > 0 && !added.isEmpty()) {
            out.add(new Chunk(sb.toString(), added));
        }
        out.removeIf(c -> c.addedLines().isEmpty());
        return out;
    }
}
