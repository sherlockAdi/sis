-- Employer portal menu refresh
-- Replaces the legacy partner sidebar with the new employer structure.

SET SQL_SAFE_UPDATES = 0;

SET @super_admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SUPER_ADMIN' LIMIT 1);
SET @admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'ADMIN' LIMIT 1);
SET @sourcing_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SOURCING' LIMIT 1);

-- Disable the old partner menu rows so they do not show in the sidebar.
UPDATE AUTH_U02_menus
SET status = FALSE
WHERE menu_code IN (
  'SRC_MANDATES',
  'SRC_SUBMIT',
  'SRC_SUBMISSIONS',
  'SRC_PERFORMANCE',
  'SRC_EARNINGS',
  'SRC_HELPDESK',
  'SRC_PROFILE'
);

-- Root menus
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'SRC_DASHBOARD', NULL, '/partner/dashboard', 'dashboard', 300, TRUE),
  ('Job', 'SRC_JOB', NULL, NULL, 'work', 310, TRUE),
  ('Applied Candidate', 'SRC_APPLIED_CANDIDATE', NULL, NULL, 'people', 320, TRUE),
  ('Reports', 'SRC_REPORTS', NULL, NULL, 'description', 330, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @m_emp_job := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'SRC_JOB' LIMIT 1);
SET @m_emp_applied := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'SRC_APPLIED_CANDIDATE' LIMIT 1);
SET @m_emp_reports := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'SRC_REPORTS' LIMIT 1);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Job List', 'SRC_JOB_LIST', @m_emp_job, '/partner/job-mandates', 'work', 311, TRUE),
  ('Create Job', 'SRC_JOB_CREATE', @m_emp_job, '/partner/job-mandates/new', 'add', 312, TRUE),
  ('Applied Candidate List', 'SRC_APPLIED_LIST', @m_emp_applied, '/partner/my-submissions', 'receipt_long', 321, TRUE),
  ('Interview Process', 'SRC_APPLIED_INTERVIEW', @m_emp_applied, '/partner/interviews', 'video_call', 322, TRUE),
  ('Deployment Zone', 'SRC_APPLIED_DEPLOY', @m_emp_applied, '/partner/deployment-zone', 'public', 323, TRUE),
  ('Total Job list', 'SRC_RPT_JOB_LIST', @m_emp_reports, '/partner/reports/total-jobs', 'description', 331, TRUE),
  ('Final Selected candiates', 'SRC_RPT_FINAL_SELECTED', @m_emp_reports, '/partner/reports/final-selected', 'description', 332, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Refresh visibility for the employer role.
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @sourcing_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code LIKE 'SRC_%'
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Keep admin roles in sync if this migration is run independently of the full seed.
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @super_admin_role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @admin_role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

SET SQL_SAFE_UPDATES = 1;
