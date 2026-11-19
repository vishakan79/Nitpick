ALTER TABLE findings
  ADD COLUMN resolved BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_findings_resolved ON findings(resolved, pull_id);
