-- Candidate trade test Google Drive support.
-- Adds metadata columns so SIS can store Google Drive file references instead of local storage keys.

ALTER TABLE REC_T04_candidate_trade_tests
  ADD COLUMN IF NOT EXISTS trade_video_source VARCHAR(20) NOT NULL DEFAULT 'storage' AFTER trade_video_uploaded_at,
  ADD COLUMN IF NOT EXISTS trade_video_external_file_id VARCHAR(255) DEFAULT NULL AFTER trade_video_source,
  ADD COLUMN IF NOT EXISTS trade_video_external_file_url TEXT DEFAULT NULL AFTER trade_video_external_file_id;

