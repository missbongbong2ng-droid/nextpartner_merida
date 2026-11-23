-- 관리자 설정 (예: survey:pbaas → 설문 설정 JSON). 값이 없으면 코드의 기본값을 쓴다
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);
