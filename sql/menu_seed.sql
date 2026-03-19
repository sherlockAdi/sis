-- ================================
-- Menu seed for dynamic sidebar
-- - Creates core menus (Dashboard, Guide, Location Master -> Countries/States/Cities)
-- - Grants full view permissions to Admin role
-- ================================

-- Ensure Admin role exists
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Admin', 'ADMIN', 'Administrator role', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Ensure Candidate role exists
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Candidate', 'CANDIDATE', 'Candidate portal role', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

SET @admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'ADMIN' LIMIT 1);
SET @candidate_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'CANDIDATE' LIMIT 1);

-- Parent: Candidate Portal
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Candidate Portal', 'CAND_PORTAL', NULL, NULL, 'people', 12, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @cand_portal_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_PORTAL' LIMIT 1);

-- Parent: Recruitment Master
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Recruitment Master', 'REC_MASTER', NULL, NULL, 'people', 10, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @rec_master_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'REC_MASTER' LIMIT 1);

-- Parent: Job Master
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Job Master', 'JOB_MASTER', NULL, NULL, 'work', 20, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @job_master_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'JOB_MASTER' LIMIT 1);

-- Parent: Location Master
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Location Master', 'LOC_MASTER', NULL, NULL, 'location_on', 30, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @loc_master_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'LOC_MASTER' LIMIT 1);

-- Parent: Document Master
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Document Master', 'DOC_MASTER', NULL, NULL, 'receipt_long', 40, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @doc_master_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'DOC_MASTER' LIMIT 1);

-- Parent: Payment Master
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Payment Master', 'PAY_MASTER', NULL, NULL, 'payments', 50, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_order = VALUES(menu_order), status = VALUES(status);

SET @pay_master_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'PAY_MASTER' LIMIT 1);

-- Core menus
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'DASHBOARD', NULL, '/dashboard', 'dashboard', 1, TRUE),
  ('Menu Management', 'MENU_MGMT', NULL, '/admin/menu-management', 'settings', 5, TRUE),
  ('Companies', 'COMPANIES', NULL, '/companies', 'business', 14, TRUE),
  ('Job Postings', 'JOB_POSTINGS', NULL, '/jobs', 'work', 15, TRUE),
  ('Jobs Preview', 'JOB_PREVIEW', NULL, '/jobs-preview', 'work', 16, TRUE),
  ('Recruitment Applications', 'REC_APPLICATIONS', NULL, '/recruitment/applications', 'people', 17, TRUE),
  ('Candidates', 'REC_CANDIDATES', NULL, '/recruitment/candidates', 'people', 18, TRUE),
  ('Guide', 'GUIDE', NULL, '/guide', 'menu_book', 90, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Candidate Portal children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Jobs', 'CAND_JOBS', @cand_portal_id, '/candidate/jobs', 'work', 1, TRUE),
  ('My Applications', 'CAND_APPLICATIONS', @cand_portal_id, '/candidate/applications', 'receipt_long', 2, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Recruitment Master children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Interview Modes', 'REC_INTERVIEW_MODES', @rec_master_id, '/masters/recruitment/interview-modes', 'video_call', 11, TRUE),
  ('Visa Types', 'REC_VISA_TYPES', @rec_master_id, '/masters/recruitment/visa-types', 'badge', 12, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Job Master children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Job Categories', 'JOB_CATEGORIES', @job_master_id, '/masters/job/categories', 'category', 21, TRUE),
  ('Contract Durations', 'JOB_CONTRACT_DURATIONS', @job_master_id, '/masters/job/contract-durations', 'schedule', 22, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Location Master children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Countries', 'LOC_COUNTRIES', @loc_master_id, '/location/countries', 'public', 31, TRUE),
  ('States', 'LOC_STATES', @loc_master_id, '/location/states', 'map', 32, TRUE),
  ('Cities', 'LOC_CITIES', @loc_master_id, '/location/cities', 'location_city', 33, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Document Master children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Document Types', 'DOC_TYPES', @doc_master_id, '/masters/documents/types', 'description', 41, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Payment Master children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Payment Categories', 'PAY_CATEGORIES', @pay_master_id, '/masters/payments/categories', 'payments', 51, TRUE)
ON DUPLICATE KEY UPDATE menu_name = VALUES(menu_name), parent_menu_id = VALUES(parent_menu_id), menu_path = VALUES(menu_path), menu_order = VALUES(menu_order), status = VALUES(status);

-- Give Admin full permissions for all menus
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @admin_role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U02_menus m
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Give Candidate view permissions for Candidate Portal menus
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @candidate_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.menu_code IN ('CAND_PORTAL', 'CAND_JOBS', 'CAND_APPLICATIONS')
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);
