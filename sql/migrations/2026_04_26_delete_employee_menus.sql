-- Remove all current employee menus and their permissions.
-- This keeps the EMPLOYEE role itself intact.

DELETE p
FROM AUTH_U03_role_menu_permissions p
JOIN AUTH_U02_menus m ON m.menu_id = p.menu_id
WHERE m.menu_code LIKE 'EMP_%';

DELETE FROM AUTH_U02_menus
WHERE menu_code LIKE 'EMP_%';
