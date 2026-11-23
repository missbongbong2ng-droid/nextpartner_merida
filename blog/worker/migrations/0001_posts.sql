-- 블로그 글 (본문 등 전체 내용은 data에 JSON으로, 자주 거르는 값은 열로 따로)
CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'idea',
  category   TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL DEFAULT '',
  featured   INTEGER NOT NULL DEFAULT 0,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts (status, date);
