-- ============================================
-- Sample "proper" job insert (end-to-end)
-- Uses stored procedures from sql/job_schema.sql
-- Safe to run on a fresh DB seeded with:
--   sql/location_seed.sql, sql/masters_seed.sql
--
-- What this script creates:
-- - Job: Security Guard (UAE) 2 years contract
-- - 1 location row (UAE)
-- - Requirements, Benefits, Required Documents
-- ============================================

START TRANSACTION;

-- ----------------------------
-- Ensure masters exist (minimal)
-- ----------------------------
INSERT INTO JOB_M01_job_categories (category_name, description, status)
SELECT 'Security', 'Security services & guarding', TRUE
WHERE NOT EXISTS (SELECT 1 FROM JOB_M01_job_categories WHERE category_name = 'Security');

INSERT INTO LOC_M01_countries (country_name, country_code, iso_code, status)
SELECT 'United Arab Emirates', '+971', 'AE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM LOC_M01_countries WHERE country_name = 'United Arab Emirates');

INSERT INTO DOC_M01_document_types (document_name, is_required, status)
SELECT 'Emirates ID (if available)', 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM DOC_M01_document_types WHERE document_name = 'Emirates ID (if available)');

-- ----------------------------
-- Resolve IDs (by name)
-- ----------------------------
SET @country_id := (SELECT country_id FROM LOC_M01_countries WHERE country_name = 'United Arab Emirates' ORDER BY country_id ASC LIMIT 1);
SET @category_id := (SELECT category_id FROM JOB_M01_job_categories WHERE category_name = 'Security' ORDER BY category_id ASC LIMIT 1);
SET @duration_id := (SELECT duration_id FROM JOB_M02_contract_durations WHERE duration_name = '2 Years' ORDER BY duration_id ASC LIMIT 1);

SET @doc_passport := (SELECT document_type_id FROM DOC_M01_document_types WHERE document_name = 'Passport' ORDER BY document_type_id ASC LIMIT 1);
SET @doc_photo := (SELECT document_type_id FROM DOC_M01_document_types WHERE document_name = 'Photo' ORDER BY document_type_id ASC LIMIT 1);
SET @doc_medical := (SELECT document_type_id FROM DOC_M01_document_types WHERE document_name = 'Medical Certificate' ORDER BY document_type_id ASC LIMIT 1);
SET @doc_police := (SELECT document_type_id FROM DOC_M01_document_types WHERE document_name = 'Police Clearance' ORDER BY document_type_id ASC LIMIT 1);
SET @doc_eid := (SELECT document_type_id FROM DOC_M01_document_types WHERE document_name = 'Emirates ID (if available)' ORDER BY document_type_id ASC LIMIT 1);

-- ----------------------------
-- Create the job
-- NOTE: created_by = 1 (change as needed)
-- ----------------------------
CALL sp_job_jobs(
  'CREATE',
  NULL,
  'UAESEC001',
  'Security Guard (UAE)',
  @category_id,
  @country_id,
  @duration_id,
  120,
  1800.00,
  2200.00,
  'We are hiring Security Guards for UAE sites (commercial + residential).\n\nResponsibilities:\n- Access control & visitor management\n- Patrols and incident reporting\n- CCTV monitoring and coordination with site supervisor\n\nEligibility:\n- Minimum 2 years experience\n- Basic English communication\n- Physically fit; willing to work in shifts\n\nProcess: Apply → Screening → Interview → Medical → Visa → Deployment.',
  'Open',
  1,
  NULL
);

-- sp_job_jobs stores the created id in session variable @new_job_id
SET @job_id := @new_job_id;

-- ----------------------------
-- Create a location row for the job
-- ----------------------------
CALL sp_job_locations(
  'CREATE',
  NULL,
  @job_id,
  @country_id,
  NULL,
  NULL,
  120,
  1800.00,
  2200.00
);
SET @location_id := LAST_INSERT_ID();

-- ----------------------------
-- Requirements (location-specific)
-- ----------------------------
CALL sp_job_requirements('CREATE', NULL, @job_id, @location_id, 'Minimum 2 years security / guarding experience');
CALL sp_job_requirements('CREATE', NULL, @job_id, @location_id, 'Age 21–40; physically fit for standing duty & patrols');
CALL sp_job_requirements('CREATE', NULL, @job_id, @location_id, 'Basic English communication (Hindi/Arabic is a plus)');
CALL sp_job_requirements('CREATE', NULL, @job_id, @location_id, 'No criminal record; police verification required');

-- ----------------------------
-- Benefits (location-specific)
-- ----------------------------
CALL sp_job_benefits('CREATE', NULL, @job_id, @location_id, 'Accommodation and transport provided (as per site policy)');
CALL sp_job_benefits('CREATE', NULL, @job_id, @location_id, 'Overtime as per UAE labour rules');
CALL sp_job_benefits('CREATE', NULL, @job_id, @location_id, 'Medical insurance coverage');
CALL sp_job_benefits('CREATE', NULL, @job_id, @location_id, 'Annual leave and ticket assistance (as per contract)');

-- ----------------------------
-- Documents (job-level)
-- ----------------------------
CALL sp_job_documents('CREATE', NULL, @job_id, @doc_passport, TRUE);
CALL sp_job_documents('CREATE', NULL, @job_id, @doc_photo, TRUE);
CALL sp_job_documents('CREATE', NULL, @job_id, @doc_medical, TRUE);
CALL sp_job_documents('CREATE', NULL, @job_id, @doc_police, FALSE);
CALL sp_job_documents('CREATE', NULL, @job_id, @doc_eid, FALSE);

COMMIT;

-- Quick verification (optional)
-- CALL sp_job_jobs('GET', @job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
-- CALL sp_job_locations('LIST_BY_JOB', NULL, @job_id, NULL, NULL, NULL, NULL, NULL, NULL);
-- CALL sp_job_requirements('LIST_BY_JOB', NULL, @job_id, NULL, NULL);
-- CALL sp_job_benefits('LIST_BY_JOB', NULL, @job_id, NULL, NULL);
-- CALL sp_job_documents('LIST_BY_JOB', NULL, @job_id, NULL, NULL);

