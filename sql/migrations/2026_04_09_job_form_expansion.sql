-- Job form expansion (single location, eligibility, masters)

-- Masters
CREATE TABLE IF NOT EXISTS JOB_M03_employment_types (
  employment_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS JOB_M04_work_modes (
  work_mode_id INT AUTO_INCREMENT PRIMARY KEY,
  mode_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS REC_M03_languages (
  language_id INT AUTO_INCREMENT PRIMARY KEY,
  language_name VARCHAR(100) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Job table additions
ALTER TABLE JOB_T01_jobs
  ADD COLUMN employment_type_id INT DEFAULT NULL,
  ADD COLUMN work_mode_id INT DEFAULT NULL,
  ADD COLUMN compensation_text TEXT,
  ADD COLUMN currency_id INT DEFAULT NULL,
  ADD COLUMN min_education VARCHAR(150),
  ADD COLUMN min_experience VARCHAR(150),
  ADD COLUMN min_age INT DEFAULT NULL,
  ADD COLUMN max_age INT DEFAULT NULL,
  ADD COLUMN gender_requirement VARCHAR(50);

-- Job languages
CREATE TABLE IF NOT EXISTS JOB_T07_job_languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  language_id INT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES REC_M03_languages(language_id),
  UNIQUE(job_id, language_id)
);

-- Procedures
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_job_languages $$
CREATE PROCEDURE sp_job_languages(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_job_id INT,
  IN p_language_id INT
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT l.id, l.job_id, l.language_id, m.language_name
    FROM JOB_T07_job_languages l
    JOIN REC_M03_languages m ON m.language_id = l.language_id
    WHERE l.job_id = p_job_id
    ORDER BY m.language_name ASC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T07_job_languages (job_id, language_id)
    VALUES (p_job_id, p_language_id)
    ON DUPLICATE KEY UPDATE language_id = VALUES(language_id);
    SELECT LAST_INSERT_ID() AS id;

  ELSEIF p_action = 'DELETE_BY_JOB' THEN
    DELETE FROM JOB_T07_job_languages WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_languages: invalid action';
  END IF;
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
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_languages: invalid action';
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
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_pay_currencies: invalid action';
  END CASE;
END $$

DELIMITER ;
