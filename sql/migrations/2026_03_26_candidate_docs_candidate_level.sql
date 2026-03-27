-- Migrates REC_T05_candidate_documents from application-level to candidate-level storage.
-- IMPORTANT: Review index names in your DB before running; MySQL may auto-name UNIQUE indexes.

-- 1) Drop FK to REC_T02_applications if it exists
--    (Replace constraint name if different in your DB.)
-- ALTER TABLE REC_T05_candidate_documents DROP FOREIGN KEY REC_T05_candidate_documents_ibfk_1;

-- 2) Drop the UNIQUE(application_id, document_type_id) index if present
--    (Replace index name if different; often it is named `application_id`.)
-- DROP INDEX application_id ON REC_T05_candidate_documents;

-- 3) Drop application_id column
ALTER TABLE REC_T05_candidate_documents
  DROP COLUMN application_id;

-- 4) Add new unique key for candidate-level docs
ALTER TABLE REC_T05_candidate_documents
  ADD UNIQUE KEY uq_candidate_document (candidate_id, document_type_id);

