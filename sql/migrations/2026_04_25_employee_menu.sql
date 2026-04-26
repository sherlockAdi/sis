-- Employee portal menus only.
-- Run this before the employee role/permission seed.

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Dashboard', 'EMP_DASHBOARD', NULL, '/employees/dashboard', 'dashboard', 260, TRUE),
  ('Profile', 'EMP_PROFILE', NULL, '/employees/profile', 'badge', 261, TRUE),
  ('Attandance', 'EMP_ATTENDANCE', NULL, '/employees/attendance', 'schedule', 265, TRUE),
  ('Helpdesk', 'EMP_HELPDESK', NULL, '/employees/helpdesk', 'receipt_long', 268, TRUE),
  ('Settings', 'EMP_SETTINGS', NULL, '/employees/settings', 'settings', 271, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @m_emp_profile := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'EMP_PROFILE' LIMIT 1);
SET @m_emp_attendance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'EMP_ATTENDANCE' LIMIT 1);
SET @m_emp_helpdesk := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'EMP_HELPDESK' LIMIT 1);
SET @m_emp_settings := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'EMP_SETTINGS' LIMIT 1);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Personal Info', 'EMP_PROFILE_PERSONAL', @m_emp_profile, '/employees/profile/personal-info', 'person', 262, TRUE),
  ('Additonal Local information', 'EMP_PROFILE_LOCAL', @m_emp_profile, '/employees/profile/additional-local-information', 'location_on', 263, TRUE),
  ('View Documents', 'EMP_PROFILE_DOCUMENTS', @m_emp_profile, '/employees/profile/view-documents', 'description', 264, TRUE),
  ('Daily Attendance', 'EMP_ATT_DAILY', @m_emp_attendance, '/employees/attendance/daily-attendance', 'watch_later', 266, TRUE),
  ('View Attendance', 'EMP_ATT_VIEW', @m_emp_attendance, '/employees/attendance/view-attendance', 'receipt_long', 267, TRUE),
  ('Open Ticket/ View ticket', 'EMP_HELP_OPEN', @m_emp_helpdesk, '/employees/helpdesk/open-ticket', 'confirmation_number', 269, TRUE),
  ('Ticket Status', 'EMP_HELP_STATUS', @m_emp_helpdesk, '/employees/helpdesk/ticket-status', 'info', 270, TRUE),
  ('Change Password', 'EMP_SETTINGS_PASSWORD', @m_emp_settings, '/employees/settings/change-password', 'lock_reset', 272, TRUE),
  ('Logout', 'EMP_SETTINGS_LOGOUT', @m_emp_settings, '/login', 'logout', 273, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);
