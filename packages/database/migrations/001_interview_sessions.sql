CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');

CREATE TABLE interview_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_toml   text NOT NULL,
  results_toml  text,
  status        interview_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
