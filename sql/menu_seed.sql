-- ================================
-- Menu seed for dynamic sidebar (Admin portal)
-- - Creates a process-driven Admin menu structure
-- - Grants role-based view permissions (editable via Menu Management)
-- ================================

-- ----------------
-- Roles (upsert)
-- ----------------
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Super Admin', 'SUPER_ADMIN', 'Full access', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Admin', 'ADMIN', 'Administrator role', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Recruiter', 'RECRUITER', 'Jobs + candidates + screening', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Operations', 'OPERATIONS', 'Deployment + attendance + helpdesk', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Compliance', 'COMPLIANCE', 'Documents + audit + compliance', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

-- Candidate role (for Candidate portal)
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Candidate', 'CANDIDATE', 'Candidate portal role', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

-- Sourcing Partner role (Partner portal)
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Sourcing Partner', 'SOURCING', 'Partner portal role (candidate submissions)', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

SET @super_admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SUPER_ADMIN' LIMIT 1);
SET @admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'ADMIN' LIMIT 1);
SET @recruiter_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'RECRUITER' LIMIT 1);
SET @operations_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'OPERATIONS' LIMIT 1);
SET @compliance_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'COMPLIANCE' LIMIT 1);
SET @candidate_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'CANDIDATE' LIMIT 1);
SET @sourcing_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SOURCING' LIMIT 1);

-- ----------------
-- Root menus (2-level max)
-- NOTE: menu_path values should NOT include /portal prefix; frontend prefixes automatically.
-- ----------------
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'ADM_DASHBOARD', NULL, '/dashboard', 'dashboard', 1, TRUE),
  ('Recruitment', 'ADM_RECRUITMENT', NULL, NULL, 'people', 10, TRUE),
  ('Trade Test & Assessment', 'ADM_TRADE_TEST', NULL, NULL, 'badge', 20, TRUE),
  ('Training & LMS', 'ADM_TRAINING', NULL, NULL, 'menu_book', 30, TRUE),
  ('Deployment Management', 'ADM_DEPLOYMENT', NULL, NULL, 'public', 40, TRUE),
  ('Attendance & Workforce', 'ADM_ATTENDANCE', NULL, NULL, 'schedule', 50, TRUE),
  ('Ticketing & Helpdesk', 'ADM_HELPDESK', NULL, NULL, 'receipt_long', 60, TRUE),
  ('Customer Management', 'ADM_CUSTOMERS', NULL, NULL, 'business', 70, TRUE),
  ('Partner Management', 'ADM_PARTNERS', NULL, NULL, 'people', 80, TRUE),
  ('Reports & Analytics', 'ADM_REPORTS', NULL, NULL, 'description', 90, TRUE),
  ('Compliance & Documents', 'ADM_COMPLIANCE', NULL, NULL, 'receipt_long', 100, TRUE),
  ('System Settings', 'ADM_SETTINGS', NULL, NULL, 'settings', 110, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @m_recruitment := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_RECRUITMENT' LIMIT 1);
SET @m_trade_test := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_TRADE_TEST' LIMIT 1);
SET @m_training := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_TRAINING' LIMIT 1);
SET @m_deployment := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_DEPLOYMENT' LIMIT 1);
SET @m_attendance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_ATTENDANCE' LIMIT 1);
SET @m_helpdesk := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_HELPDESK' LIMIT 1);
SET @m_customers := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_CUSTOMERS' LIMIT 1);
SET @m_partners := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_PARTNERS' LIMIT 1);
SET @m_reports := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_REPORTS' LIMIT 1);
SET @m_compliance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_COMPLIANCE' LIMIT 1);
SET @m_settings := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1);

-- ----------------
-- Children menus
-- ----------------

-- Recruitment
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Job Management', 'ADM_REC_JOBS', @m_recruitment, '/recruitment/job-management', 'work', 11, TRUE),
  ('Candidate Management', 'ADM_REC_CAND', @m_recruitment, '/recruitment/candidates', 'people', 12, TRUE),
  ('Screening & Interviews', 'ADM_REC_SCREEN', @m_recruitment, '/recruitment/screening-interviews', 'video_call', 13, TRUE),
  ('Applications', 'ADM_REC_APPS', @m_recruitment, '/recruitment/applications', 'receipt_long', 14, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Trade Test & Assessment
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Trade Test Setup', 'ADM_TT_SETUP', @m_trade_test, '/trade-test/setup', 'settings', 21, TRUE),
  ('Candidate Submissions', 'ADM_TT_SUB', @m_trade_test, '/trade-test/submissions', 'people', 22, TRUE),
  ('Evaluation Panel', 'ADM_TT_EVAL', @m_trade_test, '/trade-test/evaluation', 'badge', 23, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Training & LMS
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Training Modules', 'ADM_TR_MODULES', @m_training, '/training/modules', 'menu_book', 31, TRUE),
  ('Assign Training', 'ADM_TR_ASSIGN', @m_training, '/training/assign', 'people', 32, TRUE),
  ('Completion Tracking', 'ADM_TR_TRACK', @m_training, '/training/tracking', 'schedule', 33, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Deployment Management
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Ready for Deployment', 'ADM_DEP_READY', @m_deployment, '/deployment/ready', 'public', 41, TRUE),
  ('Visa Processing', 'ADM_DEP_VISA', @m_deployment, '/deployment/visa-processing', 'badge', 42, TRUE),
  ('Interview / Biometrics', 'ADM_DEP_BIO', @m_deployment, '/deployment/biometrics', 'video_call', 43, TRUE),
  ('Visa Approved', 'ADM_DEP_VISA_OK', @m_deployment, '/deployment/visa-approved', 'check_circle', 44, TRUE),
  ('Travel Booked', 'ADM_DEP_TRAVEL', @m_deployment, '/deployment/travel-booked', 'map', 45, TRUE),
  ('Deployed', 'ADM_DEP_DONE', @m_deployment, '/deployment/deployed', 'public', 46, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Attendance & Workforce
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Attendance Dashboard', 'ADM_ATT_DASH', @m_attendance, '/attendance/dashboard', 'schedule', 51, TRUE),
  ('Daily Attendance Logs', 'ADM_ATT_LOGS', @m_attendance, '/attendance/daily-logs', 'receipt_long', 52, TRUE),
  ('Exceptions / Regularization', 'ADM_ATT_EXC', @m_attendance, '/attendance/exceptions', 'settings', 53, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Ticketing & Helpdesk
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Open Tickets', 'ADM_HD_OPEN', @m_helpdesk, '/helpdesk/open', 'receipt_long', 61, TRUE),
  ('Escalations', 'ADM_HD_ESC', @m_helpdesk, '/helpdesk/escalations', 'settings', 62, TRUE),
  ('Closed Tickets', 'ADM_HD_CLOSED', @m_helpdesk, '/helpdesk/closed', 'receipt_long', 63, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Customer Management
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Customer List', 'ADM_CUST_LIST', @m_customers, '/companies', 'business', 71, TRUE),
  ('Active Projects', 'ADM_CUST_PROJECTS', @m_customers, '/customers/projects', 'folder', 72, TRUE),
  ('Workforce Allocation', 'ADM_CUST_ALLOC', @m_customers, '/customers/workforce-allocation', 'people', 73, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Partner Management
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Partner List', 'ADM_PART_LIST', @m_partners, '/partners/list', 'people', 81, TRUE),
  ('Candidate Referrals', 'ADM_PART_REF', @m_partners, '/partners/referrals', 'people', 82, TRUE),
  ('Performance Tracking', 'ADM_PART_PERF', @m_partners, '/partners/performance', 'description', 83, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Reports & Analytics
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Recruitment Reports', 'ADM_RPT_REC', @m_reports, '/reports/recruitment', 'description', 91, TRUE),
  ('Deployment Reports', 'ADM_RPT_DEP', @m_reports, '/reports/deployment', 'description', 92, TRUE),
  ('Attendance Reports', 'ADM_RPT_ATT', @m_reports, '/reports/attendance', 'description', 93, TRUE),
  ('Training Reports', 'ADM_RPT_TR', @m_reports, '/reports/training', 'description', 94, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Compliance & Documents
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Candidate Documents', 'ADM_COMP_CAND_DOCS', @m_compliance, '/compliance/candidate-documents', 'description', 101, TRUE),
  ('Visa & Legal Docs', 'ADM_COMP_VISA_DOCS', @m_compliance, '/compliance/visa-legal', 'receipt_long', 102, TRUE),
  ('Audit Logs', 'ADM_COMP_AUDIT', @m_compliance, '/compliance/audit-logs', 'settings', 103, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- System Settings
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('User Roles & Permissions', 'ADM_SET_ROLES', @m_settings, '/admin/menu-management', 'settings', 111, TRUE),
  ('Country Configuration', 'ADM_SET_COUNTRIES', @m_settings, '/location/countries', 'public', 112, TRUE),
  ('Job Categories', 'ADM_SET_JOB_CATS', @m_settings, '/masters/job/categories', 'category', 113, TRUE),
  ('Document Types', 'ADM_SET_DOC_TYPES', @m_settings, '/masters/documents/types', 'description', 114, TRUE),
  ('Notification Settings', 'ADM_SET_NOTIF', @m_settings, '/settings/notifications', 'settings', 115, TRUE),
  ('Integration Settings', 'ADM_SET_INTEG', @m_settings, '/settings/integrations', 'settings', 116, TRUE),
  ('Menu Management', 'ADM_SET_MENUS', @m_settings, '/admin/menu-management', 'settings', 117, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- ----------------
-- Candidate Portal (mobile-first)
-- ----------------
-- Disable older "Candidate Portal" container to avoid extra menu levels.
UPDATE AUTH_U02_menus
SET status = FALSE
WHERE menu_code = 'CAND_PORTAL';

-- Root menus (Bottom Nav on mobile, Sidebar on web)
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Home', 'CAND_HOME', NULL, '/candidate/home', 'dashboard', 200, TRUE),
  ('Jobs', 'CAND_JOBS', NULL, '/candidate/jobs', 'work', 210, TRUE),
  ('Applications', 'CAND_APPLICATIONS', NULL, '/candidate/applications', 'receipt_long', 220, TRUE),
  ('Training', 'CAND_TRAINING', NULL, '/candidate/training', 'menu_book', 230, TRUE),
  ('Profile', 'CAND_PROFILE', NULL, '/candidate/profile', 'people', 240, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @cand_profile_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_PROFILE' LIMIT 1);

-- Profile children (kept clean; can be expanded later)
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('My Documents', 'CAND_PROFILE_DOCS', @cand_profile_id, '/candidate/profile/documents', 'description', 241, TRUE),
  ('Trade Test', 'CAND_PROFILE_TRADE_TEST', @cand_profile_id, '/candidate/profile/trade-test', 'badge', 242, TRUE),
  ('Deployment Status', 'CAND_PROFILE_DEPLOYMENT', @cand_profile_id, '/candidate/profile/deployment', 'public', 243, TRUE),
  ('Helpdesk', 'CAND_PROFILE_HELPDESK', @cand_profile_id, '/candidate/profile/helpdesk', 'receipt_long', 244, TRUE),
  ('Settings', 'CAND_PROFILE_SETTINGS', @cand_profile_id, '/candidate/profile/settings', 'settings', 245, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- ----------------
-- Partner (Sourcing) Portal
-- ----------------
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'SRC_DASHBOARD', NULL, '/partner/dashboard', 'dashboard', 300, TRUE),
  ('Job Mandates', 'SRC_MANDATES', NULL, '/partner/job-mandates', 'work', 310, TRUE),
  ('Submit Candidate', 'SRC_SUBMIT', NULL, '/partner/submit-candidate', 'people', 320, TRUE),
  ('My Submissions', 'SRC_SUBMISSIONS', NULL, '/partner/my-submissions', 'receipt_long', 330, TRUE),
  ('Performance', 'SRC_PERFORMANCE', NULL, '/partner/performance', 'description', 340, TRUE),
  ('Earnings', 'SRC_EARNINGS', NULL, '/partner/earnings', 'payments', 350, TRUE),
  ('Helpdesk', 'SRC_HELPDESK', NULL, '/partner/helpdesk', 'receipt_long', 360, TRUE),
  ('Profile & Settings', 'SRC_PROFILE', NULL, '/partner/profile', 'settings', 370, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- ----------------
-- Hide old seed menus (from earlier versions) to avoid duplicates
-- ----------------
UPDATE AUTH_U02_menus
SET status = FALSE
WHERE menu_code IN ('DASHBOARD','MENU_MGMT','COMPANIES','JOB_POSTINGS','JOB_PREVIEW','REC_APPLICATIONS','REC_CANDIDATES','GUIDE','REC_MASTER','JOB_MASTER','LOC_MASTER','DOC_MASTER','PAY_MASTER');

-- ----------------
-- Permissions
-- ----------------

-- Super Admin: full permissions for all active menus
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @super_admin_role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Admin: view + edit by default (adjust in Menu Management)
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @admin_role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Recruiter: recruitment + reports (view)
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @recruiter_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND (
    m.menu_code IN ('ADM_DASHBOARD','ADM_RECRUITMENT','ADM_REC_JOBS','ADM_REC_CAND','ADM_REC_SCREEN','ADM_REC_APPS','ADM_REPORTS','ADM_RPT_REC')
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Operations: deployment + attendance + helpdesk + reports (view)
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @operations_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code IN (
    'ADM_DASHBOARD',
    'ADM_DEPLOYMENT','ADM_DEP_READY','ADM_DEP_VISA','ADM_DEP_BIO','ADM_DEP_VISA_OK','ADM_DEP_TRAVEL','ADM_DEP_DONE',
    'ADM_ATTENDANCE','ADM_ATT_DASH','ADM_ATT_LOGS','ADM_ATT_EXC',
    'ADM_HELPDESK','ADM_HD_OPEN','ADM_HD_ESC','ADM_HD_CLOSED',
    'ADM_REPORTS','ADM_RPT_DEP','ADM_RPT_ATT'
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Compliance: compliance + documents + audit logs + reports (view)
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @compliance_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code IN (
    'ADM_DASHBOARD',
    'ADM_COMPLIANCE','ADM_COMP_CAND_DOCS','ADM_COMP_VISA_DOCS','ADM_COMP_AUDIT',
    'ADM_REPORTS','ADM_RPT_DEP','ADM_RPT_REC'
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Candidate: Candidate portal menus (view)
INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @candidate_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code LIKE 'CAND_%'
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

-- Sourcing Partner: Partner portal menus (view)
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
