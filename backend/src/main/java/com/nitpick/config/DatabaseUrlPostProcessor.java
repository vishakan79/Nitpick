package com.nitpick.config;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/** Turns DATABASE_URL (postgres://user:pass@host/db?sslmode=require, as given by Neon) into Spring datasource properties. */
public class DatabaseUrlPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        String raw = env.getProperty("DATABASE_URL");
        if (raw == null || raw.isBlank()) {
            return;
        }
        Map<String, Object> m = convert(raw.trim());
        env.getPropertySources().addFirst(new MapPropertySource("nitpickDatabaseUrl", m));
    }

    static Map<String, Object> convert(String raw) {
        if (raw.startsWith("jdbc:")) {
            Map<String, Object> m = new HashMap<>();
            m.put("spring.datasource.url", raw);
            return m;
        }
        URI uri = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://"));
        String user = null;
        String pass = null;
        if (uri.getRawUserInfo() != null) {
            String[] up = uri.getRawUserInfo().split(":", 2);
            user = java.net.URLDecoder.decode(up[0], java.nio.charset.StandardCharsets.UTF_8);
            if (up.length > 1) {
                pass = java.net.URLDecoder.decode(up[1], java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String query = uri.getRawQuery();
        if (query == null || !query.contains("sslmode=")) {
            query = (query == null || query.isBlank() ? "" : query + "&") + "sslmode=require";
        }
        // channel_binding is not supported by the JDBC driver
        query = query.replaceAll("&?channel_binding=[^&]*", "").replaceFirst("^&", "");
        String url = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getRawPath() + "?" + query;
        Map<String, Object> m = new HashMap<>();
        m.put("spring.datasource.url", url);
        if (user != null) m.put("spring.datasource.username", user);
        if (pass != null) m.put("spring.datasource.password", pass);
        return m;
    }
}
