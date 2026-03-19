-- ================================
-- Company (COM_T0x_*)
-- Tables + Procedure-only access layer
-- ================================

CREATE TABLE IF NOT EXISTS COM_T01_companies (
  company_id INT AUTO_INCREMENT PRIMARY KEY,

  company_code VARCHAR(20) UNIQUE,

  company_name VARCHAR(150) NOT NULL,

  country_id INT,
  state_id INT,
  city_id INT,

  address TEXT,

  phone VARCHAR(20),
  email VARCHAR(150),

  contact_person VARCHAR(150),

  user_id INT,

  status BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
  FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
  FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id),
  FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id)
);

CREATE TABLE IF NOT EXISTS COM_T02_company_contacts (
  contact_id INT AUTO_INCREMENT PRIMARY KEY,

  company_id INT,

  name VARCHAR(150),
  designation VARCHAR(100),

  phone VARCHAR(20),
  email VARCHAR(150),

  FOREIGN KEY (company_id) REFERENCES COM_T01_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS COM_T03_company_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,

  company_id INT,

  document_name VARCHAR(100),
  file_path TEXT,

  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES COM_T01_companies(company_id) ON DELETE CASCADE
);

DELIMITER $$

-- ================================
-- Procedures (single procedure per table; multi-action)
-- Actions: LIST, GET, CREATE, UPDATE, DISABLE, DELETE
-- ================================

DROP PROCEDURE IF EXISTS sp_com_companies $$
CREATE PROCEDURE sp_com_companies(
  IN p_action VARCHAR(30),
  IN p_company_id INT,
  IN p_company_name VARCHAR(150),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_address TEXT,
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_contact_person VARCHAR(150),
  IN p_user_id INT,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      c.company_id,
      c.company_code,
      c.company_name,
      c.country_id,
      co.country_name,
      c.state_id,
      st.state_name,
      c.city_id,
      ci.city_name,
      c.address,
      c.phone,
      c.email,
      c.contact_person,
      c.user_id,
      c.status,
      c.created_at
    FROM COM_T01_companies c
    LEFT JOIN LOC_M01_countries co ON co.country_id = c.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = c.state_id
    LEFT JOIN LOC_M03_cities ci ON ci.city_id = c.city_id
    WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR c.status = TRUE
    ORDER BY c.company_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT *
    FROM COM_T01_companies
    WHERE company_id = p_company_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO COM_T01_companies (
      company_code,
      company_name,
      country_id, state_id, city_id,
      address,
      phone, email,
      contact_person,
      user_id,
      status
    ) VALUES (
      NULL,
      p_company_name,
      p_country_id, p_state_id, p_city_id,
      p_address,
      p_phone, p_email,
      p_contact_person,
      p_user_id,
      COALESCE(p_status, TRUE)
    );
    SET @new_id := LAST_INSERT_ID();
    UPDATE COM_T01_companies
    SET company_code = CONCAT('CO', LPAD(@new_id, 6, '0'))
    WHERE company_id = @new_id;
    SELECT @new_id AS company_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE COM_T01_companies
    SET
      company_name = COALESCE(p_company_name, company_name),
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      address = COALESCE(p_address, address),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      contact_person = COALESCE(p_contact_person, contact_person),
      user_id = COALESCE(p_user_id, user_id),
      status = COALESCE(p_status, status)
    WHERE company_id = p_company_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DISABLE' THEN
    UPDATE COM_T01_companies SET status = FALSE WHERE company_id = p_company_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM COM_T01_companies WHERE company_id = p_company_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_com_companies: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_com_company_contacts $$
CREATE PROCEDURE sp_com_company_contacts(
  IN p_action VARCHAR(30),
  IN p_contact_id INT,
  IN p_company_id INT,
  IN p_name VARCHAR(150),
  IN p_designation VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150)
)
BEGIN
  IF p_action = 'LIST_BY_COMPANY' THEN
    SELECT contact_id, company_id, name, designation, phone, email
    FROM COM_T02_company_contacts
    WHERE company_id = p_company_id
    ORDER BY contact_id DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO COM_T02_company_contacts (company_id, name, designation, phone, email)
    VALUES (p_company_id, p_name, p_designation, p_phone, p_email);
    SELECT LAST_INSERT_ID() AS contact_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE COM_T02_company_contacts
    SET
      name = COALESCE(p_name, name),
      designation = COALESCE(p_designation, designation),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email)
    WHERE contact_id = p_contact_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM COM_T02_company_contacts WHERE contact_id = p_contact_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_com_company_contacts: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_com_company_documents $$
CREATE PROCEDURE sp_com_company_documents(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_company_id INT,
  IN p_document_name VARCHAR(100),
  IN p_file_path TEXT
)
BEGIN
  IF p_action = 'LIST_BY_COMPANY' THEN
    SELECT id, company_id, document_name, file_path, uploaded_at
    FROM COM_T03_company_documents
    WHERE company_id = p_company_id
    ORDER BY uploaded_at DESC, id DESC;

  ELSEIF p_action = 'UPSERT' THEN
    IF p_id IS NOT NULL THEN
      UPDATE COM_T03_company_documents
      SET
        document_name = COALESCE(p_document_name, document_name),
        file_path = COALESCE(p_file_path, file_path),
        uploaded_at = CURRENT_TIMESTAMP
      WHERE id = p_id;
      SELECT p_id AS id;
    ELSE
      SET @existing_id := NULL;
      SELECT id INTO @existing_id
      FROM COM_T03_company_documents
      WHERE company_id = p_company_id AND document_name = p_document_name
      ORDER BY id DESC
      LIMIT 1;

      IF @existing_id IS NOT NULL THEN
        UPDATE COM_T03_company_documents
        SET
          file_path = p_file_path,
          uploaded_at = CURRENT_TIMESTAMP
        WHERE id = @existing_id;
        SELECT @existing_id AS id;
      ELSE
        INSERT INTO COM_T03_company_documents (company_id, document_name, file_path)
        VALUES (p_company_id, p_document_name, p_file_path);
        SELECT LAST_INSERT_ID() AS id;
      END IF;
    END IF;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM COM_T03_company_documents WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_com_company_documents: invalid action';
  END IF;
END $$

DELIMITER ;
