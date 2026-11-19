package com.nitpick.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.nitpick.config.Props;
import com.nitpick.github.GithubClient;
import com.nitpick.security.CryptoService;
import com.nitpick.security.JwtService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);
    private final Props props;
    private final GithubClient github;
    private final JwtService jwt;
    private final CryptoService crypto;
    private final JdbcTemplate jdbc;

    public AuthController(Props props, GithubClient github, JwtService jwt, CryptoService crypto, JdbcTemplate jdbc) {
        this.props = props;
        this.github = github;
        this.jwt = jwt;
        this.crypto = crypto;
        this.jdbc = jdbc;
    }

    @GetMapping("/")
    public java.util.Map<String, String> root() {
        return java.util.Map.of("name", "nitpick-api", "status", "ok");
    }

    @GetMapping("/auth/github")
    public ResponseEntity<Void> login() {
        String state = jwt.issue(UUID.randomUUID().toString(), "state", Duration.ofMinutes(10));
        String url = "https://github.com/login/oauth/authorize?client_id=" + enc(props.githubClientId)
                + "&redirect_uri=" + enc(props.publicUrl + "/auth/github/callback")
                + "&scope=" + enc("read:user user:email public_repo write:repo_hook repo:status")
                + "&state=" + enc(state);
        return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, url).build();
    }

    @GetMapping("/auth/github/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code, @RequestParam(required = false) String state) {
        if (props.githubClientSecret == null || props.githubClientSecret.isBlank()) {
            log.error("GITHUB_CLIENT_SECRET is not set on the server");
        }
        if (code == null || state == null || jwt.verify(state, "state") == null) {
            return redirect(props.frontendUrl + "/login?error=invalid_state");
        }
        try {
            String token = github.exchangeCode(code);
            JsonNode u = github.user(token);
            String email = u.path("email").asText(null);
            if (email == null) {
                JsonNode emails = github.primaryEmail(token);
                if (emails != null && emails.isArray()) {
                    for (JsonNode e : emails) {
                        if (e.path("primary").asBoolean(false)) {
                            email = e.path("email").asText(null);
                            break;
                        }
                    }
                }
            }
            Long id = jdbc.queryForObject("""
                    INSERT INTO users(github_id, login, name, avatar_url, email, token_enc) VALUES (?,?,?,?,?,?)
                    ON CONFLICT (github_id) DO UPDATE SET login=EXCLUDED.login, name=EXCLUDED.name,
                      avatar_url=EXCLUDED.avatar_url, email=EXCLUDED.email, token_enc=EXCLUDED.token_enc
                    RETURNING id""", Long.class,
                    u.path("id").asLong(), u.path("login").asText(), u.path("name").asText(null),
                    u.path("avatar_url").asText(null), email, crypto.encrypt(token));
            Integer rules = jdbc.queryForObject("SELECT count(*) FROM rules WHERE user_id=?", Integer.class, id);
            if (rules != null && rules == 0) {
                seedRules(id);
            }
            String session = jwt.issue(String.valueOf(id), "session", Duration.ofDays(7));
            return redirect(props.frontendUrl + "/auth/callback#token=" + session);
        } catch (Exception e) {
            log.error("GitHub sign-in failed: {}", e.toString());
            return redirect(props.frontendUrl + "/login?error=github_failed");
        }
    }

    private void seedRules(Long userId) {
        String[][] defaults = {
                {"No database queries inside loops", "Flag N+1 queries; suggest batching or joins."},
                {"Never build SQL from user input", "Require parameterized queries."},
                {"New logic needs tests", "Point out added branches without matching tests."}
        };
        for (String[] r : defaults) {
            jdbc.update("INSERT INTO rules(user_id, name, description) VALUES (?,?,?)", userId, r[0], r[1]);
        }
    }

    private static ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, url).build();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
