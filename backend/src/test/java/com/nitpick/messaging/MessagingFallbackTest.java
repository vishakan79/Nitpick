package com.nitpick.messaging;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/** Without RABBITMQ_URL or REDIS_URL the app must behave exactly like the Postgres-only version. */
class MessagingFallbackTest {
    @Test
    void brokerIsOffWithoutUrl() {
        ReviewBroker broker = new ReviewBroker("");
        broker.setHandler(id -> { });
        broker.ensureConnected();
        assertFalse(broker.configured());
        assertFalse(broker.active());
        assertFalse(broker.publish(1L));
    }

    @Test
    void redisFailsOpenWithoutUrl() {
        RedisGate redis = new RedisGate("");
        redis.ensureConnected();
        assertFalse(redis.active());
        assertTrue(redis.allow("k", 1, 60));
        assertTrue(redis.allow("k", 1, 60));
        assertNull(redis.get("k"));
        redis.put("k", "v", 10);
        assertNull(redis.get("k"));
    }
}
