-- 글 조회수 (날짜별, 한국 시간 기준 YYYY-MM-DD)
CREATE TABLE IF NOT EXISTS post_views (
  post_id TEXT NOT NULL,
  day     TEXT NOT NULL,
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, day)
);
