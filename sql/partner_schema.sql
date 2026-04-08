-- ============================================
-- Partner Transactions Schema + Procedures
-- NOTE: API must access DB via procedures only.
-- ============================================

-- ============================================
-- PART_T01_partners
-- ============================================

CREATE TABLE IF NOT EXISTS PART_T01_partners (
    partner_id INT AUTO_INCREMENT PRIMARY KEY,
    partner_code VARCHAR(20) UNIQUE,
    partner_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    address VARCHAR(255),
    user_id INT DEFAULT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id)
);

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_partners $$
CREATE PROCEDURE sp_partners(
  IN p_action VARCHAR(30),
  IN p_partner_id INT,
  IN p_partner_name VARCHAR(150),
  IN p_contact_name VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_address VARCHAR(255),
  IN p_user_id INT,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      p.partner_id,
      p.partner_code,
      p.partner_name,
      p.contact_name,
      p.phone,
      p.email,
      p.address,
      p.user_id,
      u.username,
      p.status,
      p.created_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    WHERE (p_include_inactive = TRUE OR p.status = TRUE)
    ORDER BY p.partner_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT
      p.partner_id,
      p.partner_code,
      p.partner_name,
      p.contact_name,
      p.phone,
      p.email,
      p.address,
      p.user_id,
      u.username,
      p.status,
      p.created_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    WHERE p.partner_id = p_partner_id
    LIMIT 1;

  ELSEIF p_action = 'GET_BY_USER' THEN
    SELECT
      p.partner_id,
      p.partner_code,
      p.partner_name,
      p.contact_name,
      p.phone,
      p.email,
      p.address,
      p.user_id,
      u.username,
      p.status,
      p.created_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    WHERE p.user_id = p_user_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO PART_T01_partners (
      partner_code, partner_name, contact_name, phone, email, address, user_id, status
    ) VALUES (
      NULL, p_partner_name, p_contact_name, p_phone, p_email, p_address, p_user_id, COALESCE(p_status, TRUE)
    );
    SET @new_id := LAST_INSERT_ID();
    UPDATE PART_T01_partners
    SET partner_code = CONCAT('P', LPAD(@new_id, 6, '0'))
    WHERE partner_id = @new_id;
    SELECT @new_id AS partner_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE PART_T01_partners
    SET
      partner_name = COALESCE(p_partner_name, partner_name),
      contact_name = COALESCE(p_contact_name, contact_name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      address = COALESCE(p_address, address),
      user_id = COALESCE(p_user_id, user_id),
      status = COALESCE(p_status, status)
    WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_USER' THEN
    UPDATE PART_T01_partners
    SET user_id = p_user_id
    WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM PART_T01_partners WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_partners: invalid action';
  END IF;
END $$

DELIMITER ;
