-- ================================
-- AUTH_U01_roles
-- ================================

CREATE TABLE IF NOT EXISTS AUTH_U01_roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_code VARCHAR(50) UNIQUE,
    description VARCHAR(255),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================================
-- AUTH_U02_menus
-- ================================

CREATE TABLE IF NOT EXISTS AUTH_U02_menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_code VARCHAR(50) UNIQUE,
    parent_menu_id INT DEFAULT NULL,
    menu_path VARCHAR(255),
    icon VARCHAR(100),
    menu_order INT DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_menu_id) REFERENCES AUTH_U02_menus(menu_id)
);


-- ================================
-- AUTH_U03_role_menu_permissions
-- ================================

CREATE TABLE IF NOT EXISTS AUTH_U03_role_menu_permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,

    role_id INT NOT NULL,
    menu_id INT NOT NULL,

    can_view BOOLEAN DEFAULT TRUE,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES AUTH_U01_roles(role_id),
    FOREIGN KEY (menu_id) REFERENCES AUTH_U02_menus(menu_id),

    UNIQUE(role_id, menu_id)
);


-- ================================
-- AUTH_U04_users
-- ================================

CREATE TABLE IF NOT EXISTS AUTH_U04_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    role_id INT NOT NULL,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),

    password_hash VARCHAR(255),

    status BOOLEAN DEFAULT TRUE,

    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES AUTH_U01_roles(role_id)
);


-- ================================
-- AUTH_U05_user_otps
-- ================================

CREATE TABLE IF NOT EXISTS AUTH_U05_user_otps (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,
    contact VARCHAR(100),

    otp_code VARCHAR(10) NOT NULL,
    otp_type VARCHAR(20),

    expires_at DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id)
);

-- ================================
-- Stored Procedures (DB access layer)
-- ================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_auth_get_user_for_login $$
CREATE PROCEDURE sp_auth_get_user_for_login(IN p_username VARCHAR(100))
BEGIN
  SELECT user_id, role_id, username, password_hash, status
  FROM AUTH_U04_users
  WHERE username = p_username
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_auth_update_last_login $$
CREATE PROCEDURE sp_auth_update_last_login(IN p_user_id INT)
BEGIN
  UPDATE AUTH_U04_users SET last_login = NOW() WHERE user_id = p_user_id;
END $$

DROP PROCEDURE IF EXISTS sp_menu_feed $$
CREATE PROCEDURE sp_menu_feed(IN p_role_id INT)
BEGIN
  SELECT
    m.menu_id,
    m.menu_name,
    m.menu_code,
    m.parent_menu_id,
    m.menu_path,
    m.icon,
    m.menu_order,
    m.status,
    p.can_view,
    p.can_add,
    p.can_edit,
    p.can_delete
  FROM AUTH_U03_role_menu_permissions p
  JOIN AUTH_U02_menus m ON m.menu_id = p.menu_id
  WHERE p.role_id = p_role_id
    AND m.status = TRUE
  ORDER BY m.menu_order ASC, m.menu_id ASC;
END $$

DROP PROCEDURE IF EXISTS sp_auth_me $$
CREATE PROCEDURE sp_auth_me(IN p_user_id INT)
BEGIN
  DECLARE v_role_id INT DEFAULT NULL;

  SELECT
    u.user_id,
    u.role_id,
    u.first_name,
    u.last_name,
    u.username,
    u.email,
    u.phone,
    u.status,
    u.last_login,
    u.created_at,
    r.role_name,
    r.role_code,
    r.description AS role_description,
    r.status AS role_status
  FROM AUTH_U04_users u
  JOIN AUTH_U01_roles r ON r.role_id = u.role_id
  WHERE u.user_id = p_user_id
  LIMIT 1;

  SELECT role_id INTO v_role_id
  FROM AUTH_U04_users
  WHERE user_id = p_user_id
  LIMIT 1;

  CALL sp_menu_feed(v_role_id);
END $$

DROP PROCEDURE IF EXISTS sp_roles_list $$
CREATE PROCEDURE sp_roles_list()
BEGIN
  SELECT role_id, role_name, role_code, description, status, created_at
  FROM AUTH_U01_roles
  ORDER BY role_id DESC;
END $$

DROP PROCEDURE IF EXISTS sp_roles_get $$
CREATE PROCEDURE sp_roles_get(IN p_role_id INT)
BEGIN
  SELECT role_id, role_name, role_code, description, status, created_at
  FROM AUTH_U01_roles
  WHERE role_id = p_role_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_roles_get_by_code $$
CREATE PROCEDURE sp_roles_get_by_code(IN p_role_code VARCHAR(50))
BEGIN
  SELECT role_id, role_name, role_code, description, status, created_at
  FROM AUTH_U01_roles
  WHERE role_code = p_role_code
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_roles_create $$
CREATE PROCEDURE sp_roles_create(
  IN p_role_name VARCHAR(50),
  IN p_role_code VARCHAR(50),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN
)
BEGIN
  INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
  VALUES (p_role_name, p_role_code, p_description, COALESCE(p_status, TRUE));
  SELECT LAST_INSERT_ID() AS role_id;
END $$

DROP PROCEDURE IF EXISTS sp_roles_update $$
CREATE PROCEDURE sp_roles_update(
  IN p_role_id INT,
  IN p_role_name VARCHAR(50),
  IN p_role_code VARCHAR(50),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN
)
BEGIN
  UPDATE AUTH_U01_roles
  SET
    role_name = COALESCE(p_role_name, role_name),
    role_code = COALESCE(p_role_code, role_code),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status)
  WHERE role_id = p_role_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_roles_disable $$
CREATE PROCEDURE sp_roles_disable(IN p_role_id INT)
BEGIN
  UPDATE AUTH_U01_roles SET status = FALSE WHERE role_id = p_role_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_menus_list $$
CREATE PROCEDURE sp_menus_list()
BEGIN
  SELECT menu_id, menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status, created_at
  FROM AUTH_U02_menus
  ORDER BY menu_order ASC, menu_id ASC;
END $$

DROP PROCEDURE IF EXISTS sp_menus_get $$
CREATE PROCEDURE sp_menus_get(IN p_menu_id INT)
BEGIN
  SELECT menu_id, menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status, created_at
  FROM AUTH_U02_menus
  WHERE menu_id = p_menu_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_menus_create $$
CREATE PROCEDURE sp_menus_create(
  IN p_menu_name VARCHAR(100),
  IN p_menu_code VARCHAR(50),
  IN p_parent_menu_id INT,
  IN p_menu_path VARCHAR(255),
  IN p_icon VARCHAR(100),
  IN p_menu_order INT,
  IN p_status BOOLEAN
)
BEGIN
  INSERT INTO AUTH_U02_menus
    (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
  VALUES
    (p_menu_name, p_menu_code, p_parent_menu_id, p_menu_path, p_icon, COALESCE(p_menu_order, 0), COALESCE(p_status, TRUE));
  SELECT LAST_INSERT_ID() AS menu_id;
END $$

DROP PROCEDURE IF EXISTS sp_menus_update $$
CREATE PROCEDURE sp_menus_update(
  IN p_menu_id INT,
  IN p_menu_name VARCHAR(100),
  IN p_menu_code VARCHAR(50),
  IN p_parent_menu_id INT,
  IN p_menu_path VARCHAR(255),
  IN p_icon VARCHAR(100),
  IN p_menu_order INT,
  IN p_status BOOLEAN
)
BEGIN
  UPDATE AUTH_U02_menus
  SET
    menu_name = COALESCE(p_menu_name, menu_name),
    menu_code = COALESCE(p_menu_code, menu_code),
    parent_menu_id = COALESCE(p_parent_menu_id, parent_menu_id),
    menu_path = COALESCE(p_menu_path, menu_path),
    icon = COALESCE(p_icon, icon),
    menu_order = COALESCE(p_menu_order, menu_order),
    status = COALESCE(p_status, status)
  WHERE menu_id = p_menu_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_menus_disable $$
CREATE PROCEDURE sp_menus_disable(IN p_menu_id INT)
BEGIN
  UPDATE AUTH_U02_menus SET status = FALSE WHERE menu_id = p_menu_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_permissions_list $$
CREATE PROCEDURE sp_permissions_list(IN p_role_id INT, IN p_menu_id INT)
BEGIN
  SELECT permission_id, role_id, menu_id, can_view, can_add, can_edit, can_delete, created_at
  FROM AUTH_U03_role_menu_permissions
  WHERE (p_role_id IS NULL OR role_id = p_role_id)
    AND (p_menu_id IS NULL OR menu_id = p_menu_id)
  ORDER BY permission_id DESC;
END $$

DROP PROCEDURE IF EXISTS sp_permissions_create $$
CREATE PROCEDURE sp_permissions_create(
  IN p_role_id INT,
  IN p_menu_id INT,
  IN p_can_view BOOLEAN,
  IN p_can_add BOOLEAN,
  IN p_can_edit BOOLEAN,
  IN p_can_delete BOOLEAN
)
BEGIN
  INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
  VALUES (p_role_id, p_menu_id, COALESCE(p_can_view, TRUE), COALESCE(p_can_add, FALSE), COALESCE(p_can_edit, FALSE), COALESCE(p_can_delete, FALSE));
  SELECT LAST_INSERT_ID() AS permission_id;
END $$

DROP PROCEDURE IF EXISTS sp_permissions_update $$
CREATE PROCEDURE sp_permissions_update(
  IN p_permission_id INT,
  IN p_can_view BOOLEAN,
  IN p_can_add BOOLEAN,
  IN p_can_edit BOOLEAN,
  IN p_can_delete BOOLEAN
)
BEGIN
  UPDATE AUTH_U03_role_menu_permissions
  SET
    can_view = COALESCE(p_can_view, can_view),
    can_add = COALESCE(p_can_add, can_add),
    can_edit = COALESCE(p_can_edit, can_edit),
    can_delete = COALESCE(p_can_delete, can_delete)
  WHERE permission_id = p_permission_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_permissions_delete $$
CREATE PROCEDURE sp_permissions_delete(IN p_permission_id INT)
BEGIN
  DELETE FROM AUTH_U03_role_menu_permissions WHERE permission_id = p_permission_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_users_list $$
CREATE PROCEDURE sp_users_list()
BEGIN
  SELECT user_id, role_id, first_name, last_name, username, email, phone, status, last_login, created_at
  FROM AUTH_U04_users
  ORDER BY user_id DESC;
END $$

DROP PROCEDURE IF EXISTS sp_users_get $$
CREATE PROCEDURE sp_users_get(IN p_user_id INT)
BEGIN
  SELECT user_id, role_id, first_name, last_name, username, email, phone, status, last_login, created_at
  FROM AUTH_U04_users
  WHERE user_id = p_user_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_users_create $$
CREATE PROCEDURE sp_users_create(
  IN p_role_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_username VARCHAR(100),
  IN p_email VARCHAR(150),
  IN p_phone VARCHAR(20),
  IN p_password_hash VARCHAR(255),
  IN p_status BOOLEAN
)
BEGIN
  INSERT INTO AUTH_U04_users (role_id, first_name, last_name, username, email, phone, password_hash, status)
  VALUES (p_role_id, p_first_name, p_last_name, p_username, p_email, p_phone, p_password_hash, COALESCE(p_status, TRUE));
  SELECT LAST_INSERT_ID() AS user_id;
END $$

DROP PROCEDURE IF EXISTS sp_users_update $$
CREATE PROCEDURE sp_users_update(
  IN p_user_id INT,
  IN p_role_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_username VARCHAR(100),
  IN p_email VARCHAR(150),
  IN p_phone VARCHAR(20),
  IN p_password_hash VARCHAR(255),
  IN p_status BOOLEAN
)
BEGIN
  UPDATE AUTH_U04_users
  SET
    role_id = COALESCE(p_role_id, role_id),
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    username = COALESCE(p_username, username),
    email = COALESCE(p_email, email),
    phone = COALESCE(p_phone, phone),
    password_hash = COALESCE(p_password_hash, password_hash),
    status = COALESCE(p_status, status)
  WHERE user_id = p_user_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_users_disable $$
CREATE PROCEDURE sp_users_disable(IN p_user_id INT)
BEGIN
  UPDATE AUTH_U04_users SET status = FALSE WHERE user_id = p_user_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_otps_create $$
CREATE PROCEDURE sp_otps_create(
  IN p_user_id INT,
  IN p_contact VARCHAR(100),
  IN p_otp_code VARCHAR(10),
  IN p_otp_type VARCHAR(20),
  IN p_expires_at DATETIME
)
BEGIN
  INSERT INTO AUTH_U05_user_otps (user_id, contact, otp_code, otp_type, expires_at)
  VALUES (p_user_id, p_contact, p_otp_code, p_otp_type, p_expires_at);
  SELECT LAST_INSERT_ID() AS otp_id;
END $$

DROP PROCEDURE IF EXISTS sp_otps_get $$
CREATE PROCEDURE sp_otps_get(IN p_otp_id INT)
BEGIN
  SELECT otp_id, otp_code, expires_at, is_verified
  FROM AUTH_U05_user_otps
  WHERE otp_id = p_otp_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_otps_mark_verified $$
CREATE PROCEDURE sp_otps_mark_verified(IN p_otp_id INT)
BEGIN
  UPDATE AUTH_U05_user_otps SET is_verified = TRUE WHERE otp_id = p_otp_id;
  SELECT ROW_COUNT() AS affected_rows;
END $$

DROP PROCEDURE IF EXISTS sp_bootstrap_user_count $$
CREATE PROCEDURE sp_bootstrap_user_count()
BEGIN
  SELECT COUNT(*) AS c FROM AUTH_U04_users;
END $$

DROP PROCEDURE IF EXISTS sp_bootstrap_get_admin_role $$
CREATE PROCEDURE sp_bootstrap_get_admin_role()
BEGIN
  SELECT role_id FROM AUTH_U01_roles WHERE role_name = 'Admin' LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_bootstrap_create_admin_role $$
CREATE PROCEDURE sp_bootstrap_create_admin_role()
BEGIN
  INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
  VALUES ('Admin', 'ADMIN', 'Bootstrap admin role', TRUE);
  SELECT LAST_INSERT_ID() AS role_id;
END $$

DROP PROCEDURE IF EXISTS sp_bootstrap_create_admin_user $$
CREATE PROCEDURE sp_bootstrap_create_admin_user(
  IN p_role_id INT,
  IN p_username VARCHAR(100),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  INSERT INTO AUTH_U04_users (role_id, username, password_hash, status)
  VALUES (p_role_id, p_username, p_password_hash, TRUE);
  SELECT LAST_INSERT_ID() AS user_id;
END $$

DELIMITER ;
