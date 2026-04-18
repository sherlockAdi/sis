-- Database-wide charset fix for rich text and multilingual fields

ALTER DATABASE sis_global CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE JOB_T01_jobs
  MODIFY job_description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  MODIFY compensation_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE JOB_T02_job_requirements
  MODIFY requirement TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE JOB_T03_job_benefits
  MODIFY benefit TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE JOB_T08_job_specific_documents
  MODIFY document_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
