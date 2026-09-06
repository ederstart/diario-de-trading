-- Gamificação do Edge Journal — apenas TABELAS NOVAS.
-- Nada existente é alterado. Rode uma vez no mesmo banco (DATABASE_URL).

CREATE TABLE IF NOT EXISTS trader_profile (
  user_id        text PRIMARY KEY,
  avatar_url     text,
  equipped_frame text        NOT NULL DEFAULT 'bronze',
  coins_spent    integer     NOT NULL DEFAULT 0,
  created_at     timestamp   NOT NULL DEFAULT now(),
  updated_at     timestamp   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owned_frames (
  id          serial PRIMARY KEY,
  user_id     text      NOT NULL,
  frame_id    text      NOT NULL,
  acquired_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS owned_frames_user_frame_unique
  ON owned_frames (user_id, frame_id);

CREATE INDEX IF NOT EXISTS owned_frames_user_idx ON owned_frames (user_id);
