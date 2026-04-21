-- Partner panel expansion: locations, extra contact fields, soft delete metadata

ALTER TABLE PART_T01_partners
  ADD COLUMN country_id INT DEFAULT NULL,
  ADD COLUMN state_id INT DEFAULT NULL,
  ADD COLUMN city_id INT DEFAULT NULL,
  ADD COLUMN alt_partner_name VARCHAR(150) DEFAULT NULL,
  ADD COLUMN alt_phone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN organisation_name VARCHAR(150) DEFAULT NULL,
  ADD COLUMN address2 VARCHAR(255) DEFAULT NULL,
  ADD COLUMN pin VARCHAR(20) DEFAULT NULL,
  ADD COLUMN landline VARCHAR(30) DEFAULT NULL,
  ADD COLUMN cr_licence_number VARCHAR(100) DEFAULT NULL,
  ADD COLUMN website VARCHAR(255) DEFAULT NULL,
  ADD COLUMN other_info VARCHAR(255) DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE PART_T01_partners
  ADD CONSTRAINT fk_partners_country
    FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
  ADD CONSTRAINT fk_partners_state
    FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
  ADD CONSTRAINT fk_partners_city
    FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id);

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_partners $$
CREATE PROCEDURE sp_partners(
  IN p_action VARCHAR(30),
  IN p_partner_id INT,
  IN p_partner_code VARCHAR(20),
  IN p_partner_name VARCHAR(150),
  IN p_contact_name VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_address VARCHAR(255),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_alt_partner_name VARCHAR(150),
  IN p_alt_phone VARCHAR(20),
  IN p_organisation_name VARCHAR(150),
  IN p_address2 VARCHAR(255),
  IN p_pin VARCHAR(20),
  IN p_landline VARCHAR(30),
  IN p_cr_licence_number VARCHAR(100),
  IN p_website VARCHAR(255),
  IN p_other_info VARCHAR(255),
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
      p.country_id,
      co.country_name,
      p.state_id,
      st.state_name,
      p.city_id,
      ct.city_name,
      p.alt_partner_name,
      p.alt_phone,
      p.organisation_name,
      p.address2,
      p.pin,
      p.landline,
      p.cr_licence_number,
      p.website,
      p.other_info,
      p.user_id,
      u.username,
      p.status,
      p.created_at,
      p.updated_at,
      p.deleted_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = p.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = p.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = p.city_id
    WHERE p.deleted_at IS NULL AND (p_include_inactive = TRUE OR p.status = TRUE)
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
      p.country_id,
      co.country_name,
      p.state_id,
      st.state_name,
      p.city_id,
      ct.city_name,
      p.alt_partner_name,
      p.alt_phone,
      p.organisation_name,
      p.address2,
      p.pin,
      p.landline,
      p.cr_licence_number,
      p.website,
      p.other_info,
      p.user_id,
      u.username,
      p.status,
      p.created_at,
      p.updated_at,
      p.deleted_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = p.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = p.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = p.city_id
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
      p.country_id,
      co.country_name,
      p.state_id,
      st.state_name,
      p.city_id,
      ct.city_name,
      p.alt_partner_name,
      p.alt_phone,
      p.organisation_name,
      p.address2,
      p.pin,
      p.landline,
      p.cr_licence_number,
      p.website,
      p.other_info,
      p.user_id,
      u.username,
      p.status,
      p.created_at,
      p.updated_at,
      p.deleted_at
    FROM PART_T01_partners p
    LEFT JOIN AUTH_U04_users u ON u.user_id = p.user_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = p.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = p.state_id
    LEFT JOIN LOC_M03_cities ct ON ct.city_id = p.city_id
    WHERE p.user_id = p_user_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO PART_T01_partners (
      partner_code, partner_name, contact_name, phone, email, address, country_id, state_id, city_id,
      alt_partner_name, alt_phone, organisation_name, address2, pin, landline, cr_licence_number, website, other_info, user_id, status
    ) VALUES (
      NULLIF(p_partner_code, ''), p_partner_name, p_contact_name, p_phone, p_email, p_address,
      p_country_id, p_state_id, p_city_id, p_alt_partner_name, p_alt_phone, p_organisation_name,
      p_address2, p_pin, p_landline, p_cr_licence_number, p_website, p_other_info, p_user_id, COALESCE(p_status, TRUE)
    );
    SET @new_id := LAST_INSERT_ID();
    UPDATE PART_T01_partners
    SET partner_code = COALESCE(NULLIF(p_partner_code, ''), CONCAT('P', LPAD(@new_id, 6, '0')))
    WHERE partner_id = @new_id;
    SELECT @new_id AS partner_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE PART_T01_partners
    SET
      partner_code = COALESCE(NULLIF(p_partner_code, ''), partner_code),
      partner_name = COALESCE(p_partner_name, partner_name),
      contact_name = COALESCE(p_contact_name, contact_name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      address = COALESCE(p_address, address),
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      alt_partner_name = COALESCE(p_alt_partner_name, alt_partner_name),
      alt_phone = COALESCE(p_alt_phone, alt_phone),
      organisation_name = COALESCE(p_organisation_name, organisation_name),
      address2 = COALESCE(p_address2, address2),
      pin = COALESCE(p_pin, pin),
      landline = COALESCE(p_landline, landline),
      cr_licence_number = COALESCE(p_cr_licence_number, cr_licence_number),
      website = COALESCE(p_website, website),
      other_info = COALESCE(p_other_info, other_info),
      user_id = COALESCE(p_user_id, user_id),
      status = COALESCE(p_status, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_USER' THEN
    UPDATE PART_T01_partners
    SET user_id = p_user_id
    WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    UPDATE PART_T01_partners
    SET status = FALSE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE partner_id = p_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_partners: invalid action';
  END IF;
END $$

DELIMITER ;
