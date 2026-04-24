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

-- 7) Employment Types
CREATE TABLE IF NOT EXISTS JOB_M03_employment_types (
  employment_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8) Work Modes
CREATE TABLE IF NOT EXISTS JOB_M04_work_modes (
  work_mode_id INT AUTO_INCREMENT PRIMARY KEY,
  mode_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9) Languages
CREATE TABLE IF NOT EXISTS REC_M03_languages (
  language_id INT AUTO_INCREMENT PRIMARY KEY,
  language_name VARCHAR(100) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10) Education Master
CREATE TABLE IF NOT EXISTS REC_M04_educations (
  education_id INT AUTO_INCREMENT PRIMARY KEY,
  education_name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11) Skills Master
CREATE TABLE IF NOT EXISTS REC_M05_skills (
  skill_id INT AUTO_INCREMENT PRIMARY KEY,
  skill_name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10) Currencies (linked to country)
CREATE TABLE IF NOT EXISTS PAY_M02_currencies (
  currency_id INT AUTO_INCREMENT PRIMARY KEY,
  currency_code VARCHAR(10) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  country_id INT DEFAULT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id)
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

DROP PROCEDURE IF EXISTS sp_job_employment_types $$
CREATE PROCEDURE sp_job_employment_types(
  IN p_action VARCHAR(10),
  IN p_employment_type_id INT,
  IN p_type_name VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT employment_type_id, type_name, description, status, created_at
      FROM JOB_M03_employment_types
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY type_name ASC;
    WHEN 'GET' THEN
      SELECT employment_type_id, type_name, description, status, created_at
      FROM JOB_M03_employment_types
      WHERE employment_type_id = p_employment_type_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO JOB_M03_employment_types (type_name, description, status)
      VALUES (p_type_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS employment_type_id;
    WHEN 'UPDATE' THEN
      UPDATE JOB_M03_employment_types
      SET
        type_name = COALESCE(p_type_name, type_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE employment_type_id = p_employment_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE JOB_M03_employment_types SET status = FALSE WHERE employment_type_id = p_employment_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM JOB_M03_employment_types WHERE employment_type_id = p_employment_type_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_employment_types: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_job_work_modes $$
CREATE PROCEDURE sp_job_work_modes(
  IN p_action VARCHAR(10),
  IN p_work_mode_id INT,
  IN p_mode_name VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT work_mode_id, mode_name, description, status, created_at
      FROM JOB_M04_work_modes
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY mode_name ASC;
    WHEN 'GET' THEN
      SELECT work_mode_id, mode_name, description, status, created_at
      FROM JOB_M04_work_modes
      WHERE work_mode_id = p_work_mode_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO JOB_M04_work_modes (mode_name, description, status)
      VALUES (p_mode_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS work_mode_id;
    WHEN 'UPDATE' THEN
      UPDATE JOB_M04_work_modes
      SET
        mode_name = COALESCE(p_mode_name, mode_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE work_mode_id = p_work_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE JOB_M04_work_modes SET status = FALSE WHERE work_mode_id = p_work_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM JOB_M04_work_modes WHERE work_mode_id = p_work_mode_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_work_modes: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_rec_languages $$
CREATE PROCEDURE sp_rec_languages(
  IN p_action VARCHAR(10),
  IN p_language_id INT,
  IN p_language_name VARCHAR(100),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT language_id, language_name, status, created_at
      FROM REC_M03_languages
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY language_name ASC;
    WHEN 'GET' THEN
      SELECT language_id, language_name, status, created_at
      FROM REC_M03_languages
      WHERE language_id = p_language_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M03_languages (language_name, status)
      VALUES (p_language_name, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS language_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M03_languages
      SET
        language_name = COALESCE(p_language_name, language_name),
        status = COALESCE(p_status, status)
      WHERE language_id = p_language_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M03_languages SET status = FALSE WHERE language_id = p_language_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M03_languages WHERE language_id = p_language_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_languages: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_rec_educations $$
CREATE PROCEDURE sp_rec_educations(
  IN p_action VARCHAR(10),
  IN p_education_id INT,
  IN p_education_name VARCHAR(150),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT education_id, education_name, description, status, created_at
      FROM REC_M04_educations
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY education_name ASC;
    WHEN 'GET' THEN
      SELECT education_id, education_name, description, status, created_at
      FROM REC_M04_educations
      WHERE education_id = p_education_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M04_educations (education_name, description, status)
      VALUES (p_education_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS education_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M04_educations
      SET
        education_name = COALESCE(p_education_name, education_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M04_educations SET status = FALSE WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M04_educations WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_educations: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_rec_skills $$
CREATE PROCEDURE sp_rec_skills(
  IN p_action VARCHAR(10),
  IN p_skill_id INT,
  IN p_skill_name VARCHAR(150),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT skill_id, skill_name, description, status, created_at
      FROM REC_M05_skills
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY skill_name ASC;
    WHEN 'GET' THEN
      SELECT skill_id, skill_name, description, status, created_at
      FROM REC_M05_skills
      WHERE skill_id = p_skill_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M05_skills (skill_name, description, status)
      VALUES (p_skill_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS skill_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M05_skills
      SET
        skill_name = COALESCE(p_skill_name, skill_name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status)
      WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M05_skills SET status = FALSE WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M05_skills WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_skills: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_pay_currencies $$
CREATE PROCEDURE sp_pay_currencies(
  IN p_action VARCHAR(10),
  IN p_currency_id INT,
  IN p_currency_code VARCHAR(10),
  IN p_currency_name VARCHAR(100),
  IN p_symbol VARCHAR(10),
  IN p_country_id INT,
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT currency_id, currency_code, currency_name, symbol, country_id, status, created_at
      FROM PAY_M02_currencies
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY currency_code ASC, currency_name ASC;
    WHEN 'GET' THEN
      SELECT currency_id, currency_code, currency_name, symbol, country_id, status, created_at
      FROM PAY_M02_currencies
      WHERE currency_id = p_currency_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO PAY_M02_currencies (currency_code, currency_name, symbol, country_id, status)
      VALUES (p_currency_code, p_currency_name, p_symbol, p_country_id, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS currency_id;
    WHEN 'UPDATE' THEN
      UPDATE PAY_M02_currencies
      SET
        currency_code = COALESCE(p_currency_code, currency_code),
        currency_name = COALESCE(p_currency_name, currency_name),
        symbol = COALESCE(p_symbol, symbol),
        country_id = COALESCE(p_country_id, country_id),
        status = COALESCE(p_status, status)
      WHERE currency_id = p_currency_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE PAY_M02_currencies SET status = FALSE WHERE currency_id = p_currency_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM PAY_M02_currencies WHERE currency_id = p_currency_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_pay_currencies: invalid action';
  END CASE;
END $$

DELIMITER ;
