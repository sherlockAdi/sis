-- Partner schema + job linkage + procedures

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

-- Add partner_id on jobs
ALTER TABLE JOB_T01_jobs
  ADD COLUMN partner_id INT DEFAULT NULL;

-- Stored procedures
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

DROP PROCEDURE IF EXISTS sp_job_jobs $$
CREATE PROCEDURE sp_job_jobs(
  IN p_action VARCHAR(20),
  IN p_job_id INT,
  IN p_job_code VARCHAR(20),
  IN p_job_title VARCHAR(150),
  IN p_category_id INT,
  IN p_country_id INT,
  IN p_contract_duration_id INT,
  IN p_vacancy INT,
  IN p_salary_min DECIMAL(10,2),
  IN p_salary_max DECIMAL(10,2),
  IN p_job_description TEXT,
  IN p_status VARCHAR(50),
  IN p_partner_id INT,
  IN p_created_by INT,
  IN p_remarks VARCHAR(255)
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      j.job_id,
      j.job_code,
      j.job_title,
      j.category_id,
      c.category_name,
      agg.primary_country_id AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      agg.total_vacancy AS vacancy,
      agg.salary_min AS salary_min,
      agg.salary_max AS salary_max,
      j.partner_id,
      p.partner_name,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN (
      SELECT
        job_id,
        MIN(country_id) AS primary_country_id,
        SUM(COALESCE(vacancy,0)) AS total_vacancy,
        MIN(salary_min) AS salary_min,
        MAX(salary_max) AS salary_max
      FROM JOB_T05_job_locations
      GROUP BY job_id
    ) agg ON agg.job_id = j.job_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = agg.primary_country_id
    LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
    ORDER BY j.job_id DESC;

  ELSEIF p_action = 'LIST_BY_PARTNER' THEN
    SELECT
      j.job_id,
      j.job_code,
      j.job_title,
      j.category_id,
      c.category_name,
      agg.primary_country_id AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      agg.total_vacancy AS vacancy,
      agg.salary_min AS salary_min,
      agg.salary_max AS salary_max,
      j.partner_id,
      p.partner_name,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN (
      SELECT
        job_id,
        MIN(country_id) AS primary_country_id,
        SUM(COALESCE(vacancy,0)) AS total_vacancy,
        MIN(salary_min) AS salary_min,
        MAX(salary_max) AS salary_max
      FROM JOB_T05_job_locations
      GROUP BY job_id
    ) agg ON agg.job_id = j.job_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = agg.primary_country_id
    LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
    WHERE j.partner_id = p_partner_id
    ORDER BY j.job_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT
      j.job_id,
      j.job_code,
      j.job_title,
      j.category_id,
      c.category_name,
      agg.primary_country_id AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      agg.total_vacancy AS vacancy,
      agg.salary_min AS salary_min,
      agg.salary_max AS salary_max,
      j.job_description,
      j.partner_id,
      p.partner_name,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN (
      SELECT
        job_id,
        MIN(country_id) AS primary_country_id,
        SUM(COALESCE(vacancy,0)) AS total_vacancy,
        MIN(salary_min) AS salary_min,
        MAX(salary_max) AS salary_max
      FROM JOB_T05_job_locations
      GROUP BY job_id
    ) agg ON agg.job_id = j.job_id
    LEFT JOIN LOC_M01_countries co ON co.country_id = agg.primary_country_id
    LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
    WHERE j.job_id = p_job_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T01_jobs (
      job_code, job_title, category_id, country_id, contract_duration_id,
      vacancy, salary_min, salary_max, job_description, partner_id, status, created_by
    ) VALUES (
      NULLIF(p_job_code, ''), p_job_title, p_category_id, p_country_id, p_contract_duration_id,
      p_vacancy, p_salary_min, p_salary_max, p_job_description, p_partner_id, COALESCE(NULLIF(p_status,''), 'Open'), p_created_by
    );

    SET @new_job_id := LAST_INSERT_ID();

    IF (p_job_code IS NULL OR p_job_code = '') THEN
      UPDATE JOB_T01_jobs
      SET job_code = CONCAT('JOB', LPAD(@new_job_id, 6, '0'))
      WHERE job_id = @new_job_id;
    END IF;

    INSERT INTO JOB_T06_job_status_history (job_id, status, remarks, changed_by)
    VALUES (@new_job_id, COALESCE(NULLIF(p_status,''), 'Open'), 'Job created', p_created_by);

    SELECT @new_job_id AS job_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE JOB_T01_jobs
    SET
      job_code = COALESCE(NULLIF(p_job_code,''), job_code),
      job_title = COALESCE(NULLIF(p_job_title,''), job_title),
      category_id = COALESCE(p_category_id, category_id),
      country_id = COALESCE(p_country_id, country_id),
      contract_duration_id = COALESCE(p_contract_duration_id, contract_duration_id),
      vacancy = COALESCE(p_vacancy, vacancy),
      salary_min = COALESCE(p_salary_min, salary_min),
      salary_max = COALESCE(p_salary_max, salary_max),
      job_description = COALESCE(p_job_description, job_description),
      partner_id = COALESCE(p_partner_id, partner_id),
      status = COALESCE(NULLIF(p_status,''), status)
    WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_STATUS' THEN
    UPDATE JOB_T01_jobs
    SET status = COALESCE(NULLIF(p_status,''), status)
    WHERE job_id = p_job_id;

    IF ROW_COUNT() > 0 THEN
      INSERT INTO JOB_T06_job_status_history (job_id, status, remarks, changed_by)
      VALUES (p_job_id, COALESCE(NULLIF(p_status,''), 'Open'), p_remarks, p_created_by);
    END IF;

    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T01_jobs WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_jobs: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_rec_applications $$
CREATE PROCEDURE sp_rec_applications(
  IN p_action VARCHAR(30),
  IN p_application_id INT,
  IN p_candidate_id INT,
  IN p_job_id INT,
  IN p_application_date DATE,
  IN p_status VARCHAR(50),
  IN p_partner_id INT
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      a.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      a.application_date,
      a.status
    FROM REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    ORDER BY a.application_id DESC;

  ELSEIF p_action = 'LIST_BY_PARTNER' THEN
    SELECT
      a.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      a.application_date,
      a.status
    FROM REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    WHERE j.partner_id = p_partner_id
    ORDER BY a.application_id DESC;

  ELSEIF p_action = 'LIST_BY_CANDIDATE' THEN
    SELECT
      a.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      a.application_date,
      a.status
    FROM REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    WHERE a.candidate_id = p_candidate_id
    ORDER BY a.application_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT * FROM REC_T02_applications WHERE application_id = p_application_id LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    BEGIN
      DECLARE v_existing_id INT DEFAULT NULL;
      SELECT application_id INTO v_existing_id
      FROM REC_T02_applications
      WHERE candidate_id = p_candidate_id AND job_id = p_job_id
      ORDER BY application_id DESC
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        SELECT v_existing_id AS application_id;
      ELSE
        INSERT INTO REC_T02_applications (candidate_id, job_id, application_date, status)
        VALUES (p_candidate_id, p_job_id, COALESCE(p_application_date, CURDATE()), COALESCE(NULLIF(p_status,''), 'Applied'));
        SELECT LAST_INSERT_ID() AS application_id;
      END IF;
    END;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE REC_T02_applications
    SET
      candidate_id = COALESCE(p_candidate_id, candidate_id),
      job_id = COALESCE(p_job_id, job_id),
      application_date = COALESCE(p_application_date, application_date),
      status = COALESCE(NULLIF(p_status,''), status)
    WHERE application_id = p_application_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T02_applications WHERE application_id = p_application_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_applications: invalid action';
  END IF;
END $$

DELIMITER ;
