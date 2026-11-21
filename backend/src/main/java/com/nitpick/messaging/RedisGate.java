package com.nitpick.messaging;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Redis helpers for rate limiting and short-lived caching. Every method fails open:
 * when REDIS_URL is missing or Redis is down, requests are allowed and nothing is cached.
 */
@Component
public class RedisGate {
    private static final Logger log = LoggerFactory.getLogger(RedisGate.class);

    private final String url;
    private volatile RedisClient client;
    private volatile StatefulRedisConnection<String, String> connection;

    public RedisGate(@Value("${REDIS_URL:}") String url) {
        this.url = url == null ? "" : url.trim();
    }

    public boolean active() {
        StatefulRedisConnection<String, String> c = connection;
        return c != null && c.isOpen();
    }

    @Scheduled(fixedDelay = 30_000, initialDelay = 5_000)
    public synchronized void ensureConnected() {
        if (url.isEmpty() || active()) return;
        try {
            if (client != null) {
                client.shutdown();
            }
            RedisURI uri = RedisURI.create(url);
            uri.setTimeout(Duration.ofSeconds(3));
            client = RedisClient.create(uri);
            client.setOptions(ClientOptions.builder()
                    .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
                    .build());
            connection = client.connect();
            log.info("Redis connected; rate limiting and caching are on");
        } catch (Exception e) {
            connection = null;
            log.warn("Redis unavailable ({}); continuing without it", e.getClass().getSimpleName());
        }
    }

    /** Fixed-window rate limit. Returns true when the call is allowed. */
    public boolean allow(String key, int limit, int windowSeconds) {
        if (!active()) return true;
        try {
            var commands = connection.sync();
            long count = commands.incr(key);
            if (count == 1) commands.expire(key, windowSeconds);
            return count <= limit;
        } catch (Exception e) {
            return true;
        }
    }

    public String get(String key) {
        if (!active()) return null;
        try {
            return connection.sync().get(key);
        } catch (Exception e) {
            return null;
        }
    }

    public void put(String key, String value, int ttlSeconds) {
        if (!active()) return;
        try {
            connection.sync().setex(key, ttlSeconds, value);
        } catch (Exception ignored) {
            // cache only
        }
    }
}
