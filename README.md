# Nitpick

AI code review on every GitHub pull request. Nitpick comments on the exact lines with bugs, security holes and slow queries.

This repository currently holds the **frontend**: a marketing site and a demo dashboard that run on sample data. The Spring Boot backend (webhooks, RabbitMQ, Spring AI) comes next.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Stack

React 18, Vite, Tailwind CSS, Framer Motion, React Router.

## Routes

| Path | Screen |
|---|---|
| `/` | Landing page with a live animated review |
| `/login` | Sign in (demo, no account created) |
| `/app` | Dashboard |
| `/app/pulls`, `/app/pulls/:id` | Pull requests and review detail |
| `/app/findings` | All findings with filters |
| `/app/rules` | Custom rules in plain sentences |
| `/app/settings` | Language, strictness, status checks |

## Secrets

Never commit API keys. The backend will read them from environment variables such as `GROQ_API_KEY`.

## Queue and cache

Review jobs are stored in Postgres (source of truth) and dispatched through RabbitMQ when `RABBITMQ_URL` is set. Failed jobs end up in the `nitpick.reviews.dlq` dead-letter queue. If RabbitMQ is missing or down, a Postgres poller (`FOR UPDATE SKIP LOCKED`) runs the jobs instead, so no review is lost.

Redis (`REDIS_URL`) rate-limits the assistant and caches the GitHub repository list. It fails open: without Redis the app works the same, just without those two features.

The version before RabbitMQ and Redis is tagged `v1.0-postgres-queue`.
