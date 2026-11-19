CREATE TABLE users (
  id          BIGSERIAL PRIMARY KEY,
  github_id   BIGINT NOT NULL UNIQUE,
  login       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  email       TEXT,
  token_enc   TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'en',
  strictness  TEXT NOT NULL DEFAULT 'balanced',
  fail_check  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE repos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  webhook_id  BIGINT,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, full_name)
);
CREATE INDEX idx_repos_full_name ON repos(full_name);

CREATE TABLE pulls (
  id          BIGSERIAL PRIMARY KEY,
  repo_id     BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  number      INT NOT NULL,
  title       TEXT NOT NULL,
  author      TEXT,
  head_sha    TEXT,
  status      TEXT NOT NULL DEFAULT 'queued',
  score       INT,
  critical    INT NOT NULL DEFAULT 0,
  warnings    INT NOT NULL DEFAULT 0,
  tips        INT NOT NULL DEFAULT 0,
  summary     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (repo_id, number)
);

CREATE TABLE jobs (
  id         BIGSERIAL PRIMARY KEY,
  pull_id    BIGINT NOT NULL REFERENCES pulls(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'queued',
  attempts   INT NOT NULL DEFAULT 0,
  error      TEXT,
  locked_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_status ON jobs(status, id);

CREATE TABLE findings (
  id          BIGSERIAL PRIMARY KEY,
  pull_id     BIGINT NOT NULL REFERENCES pulls(id) ON DELETE CASCADE,
  file        TEXT NOT NULL,
  line        INT NOT NULL,
  severity    TEXT NOT NULL,
  category    TEXT NOT NULL,
  message_en  TEXT NOT NULL,
  message_ta  TEXT NOT NULL,
  fix         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_findings_pull ON findings(pull_id);

CREATE TABLE rules (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
