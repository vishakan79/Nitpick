package com.nitpick.security;

import com.nitpick.config.Props;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;

    @org.springframework.beans.factory.annotation.Autowired
    public JwtService(Props props) {
        this(props.jwtSecret);
    }

    public JwtService(String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be set (32+ characters)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issue(String subject, String purpose, Duration ttl) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .claim("p", purpose)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttl.toMillis()))
                .signWith(key)
                .compact();
    }

    /** Returns the subject if the token is valid and has the given purpose, otherwise null. */
    public String verify(String token, String purpose) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return purpose.equals(c.get("p", String.class)) ? c.getSubject() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
