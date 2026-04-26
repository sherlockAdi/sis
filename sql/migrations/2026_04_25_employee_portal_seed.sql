-- Employee portal role and permissions.
-- Run this after the employee menu seed if you need the employee role wired up.

INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
VALUES ('Employee', 'EMPLOYEE', 'Employee portal role', TRUE)
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  description = VALUES(description),
  status = VALUES(status);

SET @employee_role_id := (SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'EMPLOYEE' LIMIT 1);

INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT @employee_role_id, m.menu_id, TRUE, FALSE, FALSE, FALSE
FROM AUTH_U02_menus m
WHERE m.status = TRUE
  AND m.menu_code IN (
    'EMP_DASHBOARD',
    'EMP_PROFILE',
    'EMP_PROFILE_PERSONAL',
    'EMP_PROFILE_LOCAL',
    'EMP_PROFILE_DOCUMENTS',
    'EMP_ATTENDANCE',
    'EMP_ATT_DAILY',
    'EMP_ATT_VIEW',
    'EMP_HELPDESK',
    'EMP_HELP_OPEN',
    'EMP_HELP_STATUS',
    'EMP_SETTINGS',
    'EMP_SETTINGS_PASSWORD',
    'EMP_SETTINGS_LOGOUT'
  )
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);
