# Nitpick

AI code review on every GitHub pull request. Nitpick reads the diff, comments on the exact lines with bugs, security holes and slow queries, and gives each pull request a quality score.

- Live app: https://nitpick-omega.vercel.app
- API: https://nitpick-api.onrender.com (health check at `/actuator/health`)

## How it works

```
GitHub PR event
      |  webhook (HMAC-SHA256 verified, delivery-id idempotent)
      v
Spring Boot API ---> Postgres (Neon): pulls, jobs, findings, rules
      |                    ^
      | job id             | source of truth
      v                    |
  RabbitMQ queue  ---> Review worker ---> Groq LLM (gpt-oss) + static rule scanner
  (dead-letter queue       |                       |
   for failed jobs)        v                       v
                    findings merged and de-duplicated
                           |
                           v
                GitHub review with inline comments
```

1. A pull request is opened or updated. GitHub calls the webhook.
2. The API verifies the signature, stores the pull request and a job row in Postgres, and publishes the job id to RabbitMQ.
3. The worker splits the diff into chunks, asks the model for findings, runs a deterministic scanner for SQL injection and N+1 queries, merges the two lists and removes duplicates.
4. Nitpick posts the findings as a GitHub review with inline comments and records the score: `100 - 15 x critical - 5 x warning - 1 x suggestion`, never below 0.

Reviews are delivered in 2 to 10 seconds on a warm server.

## Reliability

- **Postgres is the queue of record.** Jobs are claimed with `FOR UPDATE SKIP LOCKED`, retried up to 3 times and requeued if a worker dies mid-review.
- **RabbitMQ makes delivery instant.** If `RABBITMQ_URL` is missing or the broker is down, a Postgres poller runs the same jobs, so no review is lost. Jobs that fail three times are also sent to the `nitpick.reviews.dlq` dead-letter queue.
- **Missed webhooks are recovered.** A sweep every 10 minutes queues open pull requests that were never reviewed. A keep-alive workflow pings the API every 10 minutes because the free Render plan sleeps.
- **The model can be retired without an outage.** `GROQ_MODEL` is tried first, then each model in `GROQ_FALLBACK_MODELS`. The client retries rate limits, and retries without strict JSON mode when the model rejects it.
- **Redis is optional.** It rate-limits the assistant (12 messages a minute) and caches the GitHub repository list for 60 seconds. Every call fails open.

## Security

- GitHub OAuth login, then stateless JWT sessions. No default user, no form login.
- GitHub tokens are encrypted at rest with AES-GCM.
- Webhook signatures are verified before any work is queued.
- The RabbitMQ connection verifies the broker certificate and hostname.
- Secrets live only in environment variables. Never commit them.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router |
| Backend | Java 21, Spring Boot 3.3, Spring Security, JdbcTemplate, Flyway |
| Database | Postgres 16 on Neon |
| Queue and cache | RabbitMQ (CloudAMQP), Redis (Upstash) |
| AI | Groq, OpenAI-compatible API, `openai/gpt-oss-120b` with fallback models |
| Hosting | Vercel (frontend), Render (backend, Docker) |
| CI | GitHub Actions: frontend build and backend tests on every push, keep-alive ping |

## Pages

| Path | Screen |
|---|---|
| `/` | Landing page with a live animated review |
| `/login` | Sign in with GitHub |
| `/app` | Dashboard with your own data |
| `/app/pulls`, `/app/pulls/:id` | Pull requests and the comments posted on GitHub |
| `/app/findings` | All findings, with filters and resolve |
| `/app/rules` | Custom rules written as plain sentences |
| `/app/settings` | Review strictness and status checks |
| `/app/assistant` | Ask questions about your reviews |
| `/demo` | The same dashboard on sample data, no sign-in |

## Run it locally

Frontend:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Backend (needs Java 21 and a Postgres database):

```bash
cd backend
mvn test
mvn spring-boot:run
```

## Configuration

Backend environment variables:

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (Neon) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GROQ_API_KEY` | LLM access |
| `GROQ_MODEL`, `GROQ_FALLBACK_MODELS` | Model and fallback chain |
| `JWT_SECRET` | Signs session tokens |
| `TOKEN_ENCRYPTION_KEY` | Encrypts GitHub tokens at rest |
| `WEBHOOK_SECRET` | Verifies GitHub webhooks |
| `FRONTEND_URL`, `PUBLIC_URL` | CORS and OAuth redirects |
| `RABBITMQ_URL` | Optional. `amqps://user:password@host/vhost` |
| `REDIS_URL` | Optional. `rediss://default:token@host:6379` |

Frontend: `VITE_API_URL` points at the backend.

In the GitHub OAuth app, set the callback URL to `https://<your-api>/auth/github/callback`.

## Limits

- Reviews are posted as the signed-in GitHub user, because this is an OAuth app and not a GitHub App.
- At most 8 files and 5 diff chunks are reviewed per pull request.
- On the free Render plan the first request after idle can take up to a minute.
- Groq free-tier rate limits apply.

## History

The version before RabbitMQ and Redis, which used Postgres as the only queue, is kept on the `release/v1-postgres-queue` branch.
