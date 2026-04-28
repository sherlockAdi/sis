-- ============================================
-- Associate Partner Schema + Procedures
-- Separate script for Associate Partner journey.
-- ============================================

CREATE TABLE IF NOT EXISTS ASSOC_T01_associate_partners (
    associate_partner_id INT AUTO_INCREMENT PRIMARY KEY,
    associate_partner_code VARCHAR(20) UNIQUE,
    associate_partner_name VARCHAR(150) NOT NULL,
    alt_associate_partner_name VARCHAR(150),
    primary_contact VARCHAR(20),
    alternate_contact VARCHAR(20),
    email VARCHAR(150),
    organisation_name VARCHAR(150),
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    pin VARCHAR(20),
    landline VARCHAR(30),
    country_id INT DEFAULT NULL,
    state_id INT DEFAULT NULL,
    city_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id),
    FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
    FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
    FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id)
);

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_associate_partners $$
CREATE PROCEDURE sp_associate_partners(
  IN p_action VARCHAR(30),
  IN p_associate_partner_id INT,
  IN p_associate_partner_code VARCHAR(20),
  IN p_associate_partner_name VARCHAR(150),
  IN p_alt_associate_partner_name VARCHAR(150),
  IN p_primary_contact VARCHAR(20),
  IN p_alternate_contact VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_organisation_name VARCHAR(150),
  IN p_address1 VARCHAR(255),
  IN p_address2 VARCHAR(255),
  IN p_pin VARCHAR(20),
  IN p_landline VARCHAR(30),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_user_id INT,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN,
  IN p_unused1 VARCHAR(255),
  IN p_unused2 VARCHAR(255),
  IN p_unused3 VARCHAR(255)
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      a.associate_partner_id,
      a.associate_partner_code,
      a.associate_partner_name,
      a.alt_associate_partner_name,
      a.primary_contact,
      a.alternate_contact,
      a.email,
      a.organisation_name,
      a.address1,
      a.address2,
      a.pin,
      a.landline,
      a.country_id,
      co.country_name,
      a.state_id,
      st.state_name,
      a.city_id,
      ct.city_name,
      a.user_id,
      u.username,
      a.status,
      a.created_at,
      a.updated_at,
      a.deleted_at
    FROM ASSOC_T01_associate_partners a
    LEFT JOIN AUTH_U04_users u ON u.user_id = a.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = a.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = a.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = a.city_id
    WHERE a.deleted_at IS NULL AND (p_include_inactive = TRUE OR a.status = TRUE)
    ORDER BY a.associate_partner_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT
      a.associate_partner_id,
      a.associate_partner_code,
      a.associate_partner_name,
      a.alt_associate_partner_name,
      a.primary_contact,
      a.alternate_contact,
      a.email,
      a.organisation_name,
      a.address1,
      a.address2,
      a.pin,
      a.landline,
      a.country_id,
      co.country_name,
      a.state_id,
      st.state_name,
      a.city_id,
      ct.city_name,
      a.user_id,
      u.username,
      a.status,
      a.created_at,
      a.updated_at,
      a.deleted_at
    FROM ASSOC_T01_associate_partners a
    LEFT JOIN AUTH_U04_users u ON u.user_id = a.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = a.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = a.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = a.city_id
    WHERE a.associate_partner_id = p_associate_partner_id
    LIMIT 1;

  ELSEIF p_action = 'GET_BY_USER' THEN
    SELECT
      a.associate_partner_id,
      a.associate_partner_code,
      a.associate_partner_name,
      a.alt_associate_partner_name,
      a.primary_contact,
      a.alternate_contact,
      a.email,
      a.organisation_name,
      a.address1,
      a.address2,
      a.pin,
      a.landline,
      a.country_id,
      co.country_name,
      a.state_id,
      st.state_name,
      a.city_id,
      ct.city_name,
      a.user_id,
      u.username,
      a.status,
      a.created_at,
      a.updated_at,
      a.deleted_at
    FROM ASSOC_T01_associate_partners a
    LEFT JOIN AUTH_U04_users u ON u.user_id = a.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = a.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = a.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = a.city_id
    WHERE a.user_id = p_user_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO ASSOC_T01_associate_partners (
      associate_partner_code, associate_partner_name, alt_associate_partner_name, primary_contact, alternate_contact,
      email, organisation_name, address1, address2, pin, landline, country_id, state_id, city_id, user_id, status
    ) VALUES (
      NULLIF(p_associate_partner_code, ''), p_associate_partner_name, p_alt_associate_partner_name, p_primary_contact, p_alternate_contact,
      p_email, p_organisation_name, p_address1, p_address2, p_pin, p_landline, p_country_id, p_state_id, p_city_id, p_user_id, COALESCE(p_status, TRUE)
    );
    SET @new_id := LAST_INSERT_ID();
    UPDATE ASSOC_T01_associate_partners
    SET associate_partner_code = COALESCE(NULLIF(p_associate_partner_code, ''), CONCAT('AP', LPAD(@new_id, 6, '0')))
    WHERE associate_partner_id = @new_id;
    SELECT @new_id AS associate_partner_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE ASSOC_T01_associate_partners
    SET
      associate_partner_code = COALESCE(NULLIF(p_associate_partner_code, ''), associate_partner_code),
      associate_partner_name = COALESCE(p_associate_partner_name, associate_partner_name),
      alt_associate_partner_name = COALESCE(p_alt_associate_partner_name, alt_associate_partner_name),
      primary_contact = COALESCE(p_primary_contact, primary_contact),
      alternate_contact = COALESCE(p_alternate_contact, alternate_contact),
      email = COALESCE(p_email, email),
      organisation_name = COALESCE(p_organisation_name, organisation_name),
      address1 = COALESCE(p_address1, address1),
      address2 = COALESCE(p_address2, address2),
      pin = COALESCE(p_pin, pin),
      landline = COALESCE(p_landline, landline),
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      user_id = COALESCE(p_user_id, user_id),
      status = COALESCE(p_status, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE associate_partner_id = p_associate_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_USER' THEN
    UPDATE ASSOC_T01_associate_partners
    SET user_id = p_user_id
    WHERE associate_partner_id = p_associate_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    UPDATE ASSOC_T01_associate_partners
    SET
      status = FALSE,
      deleted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE associate_partner_id = p_associate_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_associate_partners: invalid action';
  END IF;
END $$

DELIMITER ;
