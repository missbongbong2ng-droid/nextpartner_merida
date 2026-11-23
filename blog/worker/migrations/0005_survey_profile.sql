-- 설문 응답자 성별·나이대 (선택 응답, 비어 있으면 응답 안 함/묻지 않음)
ALTER TABLE survey_responses ADD COLUMN gender TEXT NOT NULL DEFAULT '';
ALTER TABLE survey_responses ADD COLUMN age TEXT NOT NULL DEFAULT '';
