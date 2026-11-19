package com.nitpick.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class Props {
    public final String githubClientId;
    public final String githubClientSecret;
    public final String groqApiKey;
    public final String groqModel;
    public final String jwtSecret;
    public final String encryptionKey;
    public final String webhookSecret;
    public final String frontendUrl;
    public final String publicUrl;

    public Props(
            @Value("${GITHUB_CLIENT_ID:}") String githubClientId,
            @Value("${GITHUB_CLIENT_SECRET:}") String githubClientSecret,
            @Value("${GROQ_API_KEY:}") String groqApiKey,
            @Value("${GROQ_MODEL:openai/gpt-oss-120b}") String groqModel,
            @Value("${JWT_SECRET:}") String jwtSecret,
            @Value("${TOKEN_ENCRYPTION_KEY:}") String encryptionKey,
            @Value("${WEBHOOK_SECRET:}") String webhookSecret,
            @Value("${FRONTEND_URL:http://localhost:5173}") String frontendUrl,
            @Value("${PUBLIC_URL:http://localhost:8080}") String publicUrl) {
        this.githubClientId = githubClientId;
        this.githubClientSecret = githubClientSecret;
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
        this.jwtSecret = jwtSecret;
        this.encryptionKey = encryptionKey;
        this.webhookSecret = webhookSecret;
        this.frontendUrl = stripSlash(frontendUrl);
        this.publicUrl = stripSlash(publicUrl);
    }

    private static String stripSlash(String s) {
        return s != null && s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
