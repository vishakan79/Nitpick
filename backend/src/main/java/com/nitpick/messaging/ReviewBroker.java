package com.nitpick.messaging;

import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
import com.rabbitmq.client.MessageProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.LongConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ dispatcher for review jobs. The jobs table in Postgres stays the source of truth;
 * RabbitMQ delivers job ids to the worker instantly instead of waiting for the next poll.
 * If RABBITMQ_URL is not set, or the broker is down, everything falls back to the Postgres poller.
 */
@Component
public class ReviewBroker {
    private static final Logger log = LoggerFactory.getLogger(ReviewBroker.class);
    public static final String QUEUE = "nitpick.reviews";
    public static final String DEAD_LETTER_EXCHANGE = "nitpick.reviews.dlx";
    public static final String DEAD_LETTER_QUEUE = "nitpick.reviews.dlq";

    private final String url;
    private final Object publishLock = new Object();
    private volatile Connection connection;
    private volatile Channel publishChannel;
    private volatile LongConsumer handler;

    public ReviewBroker(@Value("${RABBITMQ_URL:}") String url) {
        this.url = url == null ? "" : url.trim();
    }

    public boolean configured() {
        return !url.isEmpty();
    }

    public boolean active() {
        Connection c = connection;
        return handler != null && c != null && c.isOpen();
    }

    public void setHandler(LongConsumer handler) {
        this.handler = handler;
    }

    @Scheduled(fixedDelay = 30_000, initialDelay = 5_000)
    public synchronized void ensureConnected() {
        if (!configured() || active()) return;
        try {
            connect();
            log.info("RabbitMQ connected; review jobs are delivered through queue {}", QUEUE);
        } catch (Exception e) {
            close();
            log.warn("RabbitMQ unavailable ({}); using the Postgres queue instead", e.getClass().getSimpleName());
        }
    }

    private void connect() throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setUri(url);
        factory.setConnectionTimeout(10_000);
        factory.setRequestedHeartbeat(30);
        factory.setAutomaticRecoveryEnabled(true);
        Connection c = factory.newConnection("nitpick-api");
        Channel setup = c.createChannel();
        setup.exchangeDeclare(DEAD_LETTER_EXCHANGE, "fanout", true);
        setup.queueDeclare(DEAD_LETTER_QUEUE, true, false, false, null);
        setup.queueBind(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, "");
        setup.queueDeclare(QUEUE, true, false, false, Map.of("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE));
        setup.close();

        Channel consumerChannel = c.createChannel();
        consumerChannel.basicQos(1);
        consumerChannel.basicConsume(QUEUE, false, new DefaultConsumer(consumerChannel) {
            @Override
            public void handleDelivery(String tag, Envelope envelope, AMQP.BasicProperties props, byte[] body)
                    throws IOException {
                long jobId;
                try {
                    jobId = Long.parseLong(new String(body, StandardCharsets.UTF_8).trim());
                } catch (NumberFormatException bad) {
                    getChannel().basicReject(envelope.getDeliveryTag(), false);
                    return;
                }
                try {
                    LongConsumer h = handler;
                    if (h != null) h.accept(jobId);
                    getChannel().basicAck(envelope.getDeliveryTag(), false);
                } catch (Exception e) {
                    log.error("Review job {} crashed in the consumer: {}", jobId, e.getMessage());
                    getChannel().basicNack(envelope.getDeliveryTag(), false, false);
                }
            }
        });
        this.publishChannel = c.createChannel();
        this.connection = c;
    }

    /** Sends a job id to the review queue. Returns false when the broker is unavailable (the poller will pick it up). */
    public boolean publish(long jobId) {
        return send("", QUEUE, jobId);
    }

    /** Records a permanently failed job in the dead-letter queue so it can be inspected in the RabbitMQ console. */
    public void deadLetter(long jobId) {
        send(DEAD_LETTER_EXCHANGE, "", jobId);
    }

    private boolean send(String exchange, String routingKey, long jobId) {
        if (!active()) return false;
        try {
            synchronized (publishLock) {
                publishChannel.basicPublish(exchange, routingKey, MessageProperties.PERSISTENT_TEXT_PLAIN,
                        Long.toString(jobId).getBytes(StandardCharsets.UTF_8));
            }
            return true;
        } catch (Exception e) {
            log.warn("RabbitMQ publish failed for job {}: {}", jobId, e.getClass().getSimpleName());
            return false;
        }
    }

    private void close() {
        Connection c = connection;
        connection = null;
        publishChannel = null;
        if (c != null) {
            try { c.close(2000); } catch (Exception ignored) { }
        }
    }
}
