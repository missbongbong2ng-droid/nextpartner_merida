-- 독자 설문 응답 (글 페이지에서 무작위로 묻는 한 문항)
CREATE TABLE IF NOT EXISTS survey_responses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  site       TEXT NOT NULL DEFAULT 'pbaas',
  post_id    TEXT NOT NULL DEFAULT '',
  qid        TEXT NOT NULL,
  answer     TEXT NOT NULL,
  comment    TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_survey_site ON survey_responses (site, created_at);
