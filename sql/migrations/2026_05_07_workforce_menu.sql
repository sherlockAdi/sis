-- Workforce / attendance menus for employer-wise leave and attendance management.

SET @admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'ADMIN' LIMIT 1);
SET @operations_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'OPERATIONS' LIMIT 1);
SET @super_admin_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'SUPER_ADMIN' LIMIT 1);
SET @employee_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'EMPLOYEE' LIMIT 1);

SET @m_attendance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_ATTENDANCE' LIMIT 1);
SET @m_emp_attendance := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'EMP_ATTENDANCE' LIMIT 1);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Leave Policy', 'ADM_ATT_POLICY', @m_attendance, '/attendance/policies', 'description', 54, TRUE),
  ('Holiday Calendar', 'ADM_ATT_HOLIDAYS', @m_attendance, '/attendance/holidays', 'event', 55, TRUE),
  ('Weekly Off Rules', 'ADM_ATT_WEEKOFF', @m_attendance, '/attendance/weekly-off', 'schedule', 56, TRUE),
  ('Office Geo Locations', 'ADM_ATT_OFFICE', @m_attendance, '/attendance/offices', 'location_on', 57, TRUE),
  ('Attendance Logs', 'ADM_ATT_LOGS_FULL', @m_attendance, '/attendance/logs', 'receipt_long', 58, TRUE),
  ('Leave Requests', 'ADM_ATT_LEAVE_REQ', @m_attendance, '/attendance/leave-requests', 'assignment', 59, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Leave Request', 'EMP_ATT_LEAVE', @m_emp_attendance, '/employees/attendance/leave', 'assignment', 268, TRUE),
  ('Attendance History', 'EMP_ATT_HISTORY', @m_emp_attendance, '/employees/attendance/view-attendance', 'receipt_long', 269, TRUE),
  ('Leave Balance', 'EMP_ATT_BALANCE', @m_emp_attendance, '/employees/attendance/balance', 'account_balance_wallet', 270, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT role_id, menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U01_roles r
JOIN AUTH_U02_menus m
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS')
  AND m.menu_code IN (
    'ADM_ATTENDANCE',
    'ADM_ATT_DASH',
    'ADM_ATT_LOGS',
    'ADM_ATT_EXC',
    'ADM_ATT_POLICY',
    'ADM_ATT_HOLIDAYS',
    'ADM_ATT_WEEKOFF',
    'ADM_ATT_OFFICE',
    'ADM_ATT_LOGS_FULL',
    'ADM_ATT_LEAVE_REQ'
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);

INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @employee_role_id, m.menu_id, TRUE, TRUE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code IN (
    'EMP_DASHBOARD',
    'EMP_PROFILE',
    'EMP_ATTENDANCE',
    'EMP_ATT_DAILY',
    'EMP_ATT_LEAVE',
    'EMP_ATT_HISTORY',
    'EMP_ATT_BALANCE',
    'EMP_SETTINGS'
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);
