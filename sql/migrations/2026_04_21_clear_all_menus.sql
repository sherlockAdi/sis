-- Clear all current menus and their permissions.
-- This leaves the system ready for a fresh menu structure to be inserted later.

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM AUTH_U03_role_menu_permissions;
DELETE FROM AUTH_U02_menus;

SET FOREIGN_KEY_CHECKS = 1;
