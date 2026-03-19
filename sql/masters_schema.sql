-- ================================
-- Masters (Recruitment / Job / Document / Payment)
-- Tables + Procedure-only access layer
-- One procedure per table (multi-action)
-- ================================

-- 1) Interview Modes (Recruitment Master)
CREATE TABLE IF NOT EXISTS REC_M01_interview_modes (
  interview_mode_id INT AUTO_INCREMENT PRIMARY KEY,
  mode_name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Visa Types
CREATE TABLE IF NOT EXISTS REC_M02_visa_types (
  visa_type_id INT AUTO_INCREMENT PRIMARY KEY,
  visa_type_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Job Categories
CREATE TABLE IF NOT EXISTS JOB_M01_job_categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) Contract Durations
CREATE TABLE IF NOT EXISTS JOB_M02_contract_durations (
  duration_id INT AUTO_INCREMENT PRIMARY KEY,
  duration_name VARCHAR(50),
  months INT,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5) Document Types
CREATE TABLE IF NOT EXISTS DOC_M01_document_types (
  document_type_id INT AUTO_INCREMENT PRIMARY KEY,
  document_name VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6) Payment Categories
CREATE TABLE IF NOT EXISTS PAY_M01_payment_categories (
  payment_category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- Procedures
-- Actions: LIST, GET, CREATE, UPDATE, DISABLE, DELETE
-- ================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_interview_modes $$
CREATE PROCEDURE sp_rec_interview_modes(
  IN p_action VARCHAR(10),
  IN p_interview_mode_id INT,
  IN p_mode_name VARCHAR(50),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT interview_mode_id, mode_name, description, status, created_at
      FROM REC_M01_interview_modes
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY mode_name ASC;
    WHEN 'GET' THEN
      SELECT interview_mode_id, mode_name, description, status, created_at
      FROM REC_M01_interview_modes
      WHERE interview_mode_id = p_interview_mode_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M01_interview_modes (mode_name, description, status)
      VALUES (p_mode_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS interview_mode_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M01_interview_modes
      SET
        mode_name = COALESCE(p_mode_name, mode_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE interview_mode_id = p_interview_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M01_interview_modes SET status = FALSE WHERE interview_mode_id = p_interview_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M01_interview_modes WHERE interview_mode_id = p_interview_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_interview_modes: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_rec_visa_types $$
CREATE PROCEDURE sp_rec_visa_types(
  IN p_action VARCHAR(10),
  IN p_visa_type_id INT,
  IN p_visa_type_name VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT visa_type_id, visa_type_name, description, status, created_at
      FROM REC_M02_visa_types
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY visa_type_name ASC;
    WHEN 'GET' THEN
      SELECT visa_type_id, visa_type_name, description, status, created_at
      FROM REC_M02_visa_types
      WHERE visa_type_id = p_visa_type_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M02_visa_types (visa_type_name, description, status)
      VALUES (p_visa_type_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS visa_type_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M02_visa_types
      SET
        visa_type_name = COALESCE(p_visa_type_name, visa_type_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE visa_type_id = p_visa_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M02_visa_types SET status = FALSE WHERE visa_type_id = p_visa_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M02_visa_types WHERE visa_type_id = p_visa_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_visa_types: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_job_categories $$
CREATE PROCEDURE sp_job_categories(
  IN p_action VARCHAR(10),
  IN p_category_id INT,
  IN p_category_name VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT category_id, category_name, description, status, created_at
      FROM JOB_M01_job_categories
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY category_name ASC;
    WHEN 'GET' THEN
      SELECT category_id, category_name, description, status, created_at
      FROM JOB_M01_job_categories
      WHERE category_id = p_category_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO JOB_M01_job_categories (category_name, description, status)
      VALUES (p_category_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS category_id;
    WHEN 'UPDATE' THEN
      UPDATE JOB_M01_job_categories
      SET
        category_name = COALESCE(p_category_name, category_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE category_id = p_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE JOB_M01_job_categories SET status = FALSE WHERE category_id = p_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM JOB_M01_job_categories WHERE category_id = p_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_categories: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_job_contract_durations $$
CREATE PROCEDURE sp_job_contract_durations(
  IN p_action VARCHAR(10),
  IN p_duration_id INT,
  IN p_duration_name VARCHAR(50),
  IN p_months INT,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT duration_id, duration_name, months, status, created_at
      FROM JOB_M02_contract_durations
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY months ASC, duration_name ASC;
    WHEN 'GET' THEN
      SELECT duration_id, duration_name, months, status, created_at
      FROM JOB_M02_contract_durations
      WHERE duration_id = p_duration_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO JOB_M02_contract_durations (duration_name, months, status)
      VALUES (p_duration_name, p_months, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS duration_id;
    WHEN 'UPDATE' THEN
      UPDATE JOB_M02_contract_durations
      SET
        duration_name = COALESCE(p_duration_name, duration_name),
        months = COALESCE(p_months, months),
        status = COALESCE(p_status, status)
      WHERE duration_id = p_duration_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE JOB_M02_contract_durations SET status = FALSE WHERE duration_id = p_duration_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM JOB_M02_contract_durations WHERE duration_id = p_duration_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_contract_durations: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_doc_document_types $$
CREATE PROCEDURE sp_doc_document_types(
  IN p_action VARCHAR(10),
  IN p_document_type_id INT,
  IN p_document_name VARCHAR(100),
  IN p_is_required BOOLEAN,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT document_type_id, document_name, is_required, status, created_at
      FROM DOC_M01_document_types
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY is_required DESC, document_name ASC;
    WHEN 'GET' THEN
      SELECT document_type_id, document_name, is_required, status, created_at
      FROM DOC_M01_document_types
      WHERE document_type_id = p_document_type_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO DOC_M01_document_types (document_name, is_required, status)
      VALUES (p_document_name, COALESCE(p_is_required, FALSE), COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS document_type_id;
    WHEN 'UPDATE' THEN
      UPDATE DOC_M01_document_types
      SET
        document_name = COALESCE(p_document_name, document_name),
        is_required = COALESCE(p_is_required, is_required),
        status = COALESCE(p_status, status)
      WHERE document_type_id = p_document_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE DOC_M01_document_types SET status = FALSE WHERE document_type_id = p_document_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM DOC_M01_document_types WHERE document_type_id = p_document_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_doc_document_types: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_pay_payment_categories $$
CREATE PROCEDURE sp_pay_payment_categories(
  IN p_action VARCHAR(10),
  IN p_payment_category_id INT,
  IN p_category_name VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT payment_category_id, category_name, description, status, created_at
      FROM PAY_M01_payment_categories
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY category_name ASC;
    WHEN 'GET' THEN
      SELECT payment_category_id, category_name, description, status, created_at
      FROM PAY_M01_payment_categories
      WHERE payment_category_id = p_payment_category_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO PAY_M01_payment_categories (category_name, description, status)
      VALUES (p_category_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS payment_category_id;
    WHEN 'UPDATE' THEN
      UPDATE PAY_M01_payment_categories
      SET
        category_name = COALESCE(p_category_name, category_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE payment_category_id = p_payment_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE PAY_M01_payment_categories SET status = FALSE WHERE payment_category_id = p_payment_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM PAY_M01_payment_categories WHERE payment_category_id = p_payment_category_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_pay_payment_categories: invalid action';
  END CASE;
END $$

DELIMITER ;

