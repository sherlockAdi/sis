-- Candidate portal menu expansion
-- Adds the full candidate journey structure and disables older duplicate entries.

UPDATE AUTH_U02_menus
SET status = FALSE
WHERE menu_code = 'CAND_PORTAL';

UPDATE AUTH_U02_menus
SET status = FALSE
WHERE menu_code IN (
  'CAND_APPLICATIONS',
  'CAND_TRAINING',
  'CAND_PROFILE_DEPLOYMENT',
  'CAND_PROFILE_HELPDESK'
);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Home', 'CAND_HOME', NULL, '/candidate/home', 'dashboard', 200, TRUE),
  ('Profile', 'CAND_PROFILE', NULL, '/candidate/profile', 'people', 210, TRUE),
  ('Jobs', 'CAND_JOBS', NULL, '/candidate/jobs', 'work', 220, TRUE),
  ('Onboarding Process', 'CAND_ONBOARDING', NULL, '/candidate/onboarding/offer', 'menu_book', 230, TRUE),
  ('Accounts', 'CAND_ACCOUNTS', NULL, '/candidate/accounts/payments', 'payments', 240, TRUE),
  ('Settings', 'CAND_SETTINGS', NULL, '/candidate/profile/settings', 'settings', 250, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

SET @cand_profile_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_PROFILE' LIMIT 1);
SET @cand_jobs_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_JOBS' LIMIT 1);
SET @cand_onboarding_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_ONBOARDING' LIMIT 1);
SET @cand_accounts_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_ACCOUNTS' LIMIT 1);
SET @cand_settings_id := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'CAND_SETTINGS' LIMIT 1);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Personal Info', 'CAND_PROFILE_PERSONAL', @cand_profile_id, '/candidate/profile/settings', 'badge', 211, TRUE),
  ('Upload Documents', 'CAND_PROFILE_DOCS', @cand_profile_id, '/candidate/profile/documents', 'description', 212, TRUE),
  ('Upload Trade Video', 'CAND_PROFILE_TRADE_TEST', @cand_profile_id, '/candidate/profile/trade-test', 'video_call', 213, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Job List', 'CAND_JOB_LIST', @cand_jobs_id, '/candidate/jobs', 'work', 221, TRUE),
  ('View Applied Jobs', 'CAND_VIEW_APPLIED', @cand_jobs_id, '/candidate/applications', 'receipt_long', 222, TRUE),
  ('View Job Status', 'CAND_VIEW_STATUS', @cand_jobs_id, '/candidate/profile/deployment', 'schedule', 223, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Download Offer', 'CAND_ONBOARD_OFFER', @cand_onboarding_id, '/candidate/onboarding/offer', 'receipt_long', 231, TRUE),
  ('Visa Details', 'CAND_ONBOARD_VISA', @cand_onboarding_id, '/candidate/onboarding/visa-details', 'description', 232, TRUE),
  ('Download Tickets', 'CAND_ONBOARD_TICKETS', @cand_onboarding_id, '/candidate/onboarding/tickets', 'receipt_long', 233, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Payments', 'CAND_ACCOUNT_PAYMENTS', @cand_accounts_id, '/candidate/accounts/payments', 'payments', 241, TRUE),
  ('Download Receipts', 'CAND_ACCOUNT_RECEIPTS', @cand_accounts_id, '/candidate/accounts/receipts', 'receipt_long', 242, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES
  ('Change Password', 'CAND_SETTINGS_PASSWORD', @cand_settings_id, '/candidate/profile/settings', 'settings', 251, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

