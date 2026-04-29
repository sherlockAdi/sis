-- Add a dedicated candidate list menu item under recruitment

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
SELECT
  'Candidate List',
  'ADM_REC_CAND_LIST',
  m.menu_id,
  '/recruitment/candidates',
  'people',
  13,
  TRUE
FROM AUTH_U02_menus m
WHERE m.menu_code = 'ADM_RECRUITMENT'
LIMIT 1
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);
