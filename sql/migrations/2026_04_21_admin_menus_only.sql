-- Admin-only menu rebuild
-- Clears existing menu rows and recreates only the menus requested for Super Admin and Admin.

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM AUTH_U03_role_menu_permissions WHERE permission_id > 0;
DELETE FROM AUTH_U02_menus WHERE menu_id > 0;

SET FOREIGN_KEY_CHECKS = 1;

-- Roles
INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Super Admin', 'SUPER_ADMIN', 'Full access', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Admin', 'ADMIN', 'Administrator role', TRUE)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

SET @super_admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SUPER_ADMIN' LIMIT 1);
SET @admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'ADMIN' LIMIT 1);

-- Root menus
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'ADM_DASHBOARD', NULL, '/dashboard', 'dashboard', 1, TRUE),
  ('System Settings', 'ADM_SETTINGS', NULL, NULL, 'settings', 10, TRUE),
  ('Employer', 'ADM_EMPLOYER', NULL, NULL, 'business', 20, TRUE),
  ('Associate Partners', 'ADM_ASSOC_PARTNERS', NULL, NULL, 'people', 30, TRUE),
  ('Candidate Development Zone', 'ADM_CAND_DEV_ZONE', NULL, NULL, 'public', 40, TRUE),
  ('Employee Zone', 'ADM_EMPLOYEE_ZONE', NULL, '/employees', 'people', 50, TRUE),
  ('Attendance Rule', 'ADM_ATTENDANCE', NULL, '/attendance', 'schedule', 60, TRUE),
  ('Ticketing & Helpdesk', 'ADM_HELPDESK', NULL, NULL, 'receipt_long', 70, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @m_settings := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1);
SET @m_employer := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_EMPLOYER' LIMIT 1);
SET @m_assoc := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_ASSOC_PARTNERS' LIMIT 1);
SET @m_candidate_dev := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_CAND_DEV_ZONE' LIMIT 1);
SET @m_employee := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_EMPLOYEE_ZONE' LIMIT 1);
SET @m_attendance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_ATTENDANCE' LIMIT 1);
SET @m_helpdesk := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_HELPDESK' LIMIT 1);

-- System Settings children
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'ADM_SET_DASHBOARD', @m_settings, '/dashboard', 'dashboard', 11, TRUE),
  ('User Roles & Permissions List', 'ADM_SET_ROLES', @m_settings, '/admin/menu-management', 'settings', 12, TRUE),
  ('Country', 'ADM_SET_COUNTRIES', @m_settings, '/location/countries', 'public', 13, TRUE),
  ('State', 'ADM_SET_STATES', @m_settings, '/settings/states', 'public', 14, TRUE),
  ('City', 'ADM_SET_CITIES', @m_settings, '/settings/cities', 'public', 15, TRUE),
  ('Category - Industry', 'ADM_SET_JOB_CATS', @m_settings, '/masters/job/categories', 'category', 16, TRUE),
  ('Education', 'ADM_SET_EDUCATION', @m_settings, '/settings/education', 'school', 17, TRUE),
  ('Skills', 'ADM_SET_SKILLS', @m_settings, '/settings/skills', 'handyman', 18, TRUE),
  ('Job Type', 'ADM_SET_JOB_TYPE', @m_settings, '/settings/employment-types', 'work', 19, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Employer
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Employer List', 'ADM_EMP_LIST', @m_employer, '/partners/list', 'people', 21, TRUE),
  ('Create Employer', 'ADM_EMP_CREATE', @m_employer, '/partners/new', 'add', 22, TRUE),
  ('View Jobs', 'ADM_EMP_JOBS', @m_employer, '/jobs', 'work', 23, TRUE),
  ('Applied Candidate', 'ADM_EMP_APPS', @m_employer, '/recruitment/applications', 'receipt_long', 24, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Associate Partners
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Associate Partners List', 'ADM_ASSOC_LIST', @m_assoc, '/partners/list', 'people', 31, TRUE),
  ('Create Associate Partners', 'ADM_ASSOC_CREATE', @m_assoc, '/partners/new', 'add', 32, TRUE),
  ('Applied Candidate', 'ADM_ASSOC_APPS', @m_assoc, '/recruitment/applications', 'receipt_long', 33, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Candidate Development Zone
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Offer Zone / SIS Global Workforce', 'ADM_DEP_OFFER', @m_candidate_dev, '/deployment/ready', 'public', 41, TRUE),
  ('Visa Applied / Approved', 'ADM_DEP_VISA', @m_candidate_dev, '/deployment/visa-processing', 'badge', 42, TRUE),
  ('Travel Booking', 'ADM_DEP_TRAVEL', @m_candidate_dev, '/deployment/travel-booked', 'map', 43, TRUE),
  ('Deployed', 'ADM_DEP_DONE', @m_candidate_dev, '/deployment/deployed', 'check_circle', 44, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Employee Zone
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('List of Employee', 'ADM_EMPLOYEE_LIST', @m_employee, '/employees', 'people', 51, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Attendance Rule
INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Employer Wise Attendance Rule', 'ADM_ATT_RULE', @m_attendance, '/attendance', 'schedule', 61, TRUE)
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
  ('View Ticket', 'ADM_HD_VIEW', @m_helpdesk, '/helpdesk/open', 'receipt_long', 71, TRUE),
  ('Escalations', 'ADM_HD_ESC', @m_helpdesk, '/helpdesk/escalations', 'settings', 72, TRUE),
  ('Ticket Status with Action', 'ADM_HD_STATUS', @m_helpdesk, '/helpdesk/closed', 'fact_check', 73, TRUE),
  ('Chatbot', 'ADM_HD_CHATBOT', @m_helpdesk, '/helpdesk/chatbot', 'smart_toy', 74, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

-- Grant full access to Super Admin and Admin
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
