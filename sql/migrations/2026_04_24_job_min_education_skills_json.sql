-- Store job education/skill requirements as JSON text.

ALTER TABLE JOB_T01_jobs
  MODIFY COLUMN min_education TEXT,
  ADD COLUMN skills TEXT DEFAULT NULL AFTER min_education,
  ADD COLUMN trade_test_required BOOLEAN DEFAULT FALSE AFTER gender_requirement;

DROP PROCEDURE IF EXISTS sp_job_jobs;
DELIMITER $$
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
  IN p_employment_type_id INT,
  IN p_work_mode_id INT,
  IN p_currency_id INT,
  IN p_compensation_text TEXT,
  IN p_min_education TEXT,
  IN p_skills TEXT,
  IN p_min_experience VARCHAR(150),
  IN p_min_age INT,
  IN p_max_age INT,
  IN p_gender_requirement VARCHAR(50),
  IN p_trade_test_required BOOLEAN,
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
      COALESCE(agg.primary_country_id, j.country_id) AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      COALESCE(agg.total_vacancy, j.vacancy) AS vacancy,
      COALESCE(agg.salary_min, j.salary_min) AS salary_min,
      COALESCE(agg.salary_max, j.salary_max) AS salary_max,
      j.partner_id,
      p.partner_name,
      j.employment_type_id,
      et.type_name AS employment_type_name,
      j.work_mode_id,
      wm.mode_name AS work_mode_name,
      j.currency_id,
      cur.currency_code,
      cur.currency_name,
      cur.symbol,
      j.min_education,
      j.skills,
      j.min_experience,
      j.min_age,
      j.max_age,
      j.gender_requirement,
      j.trade_test_required,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN JOB_M03_employment_types et ON et.employment_type_id = j.employment_type_id
    LEFT JOIN JOB_M04_work_modes wm ON wm.work_mode_id = j.work_mode_id
    LEFT JOIN PAY_M02_currencies cur ON cur.currency_id = j.currency_id
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
    LEFT JOIN LOC_M01_countries co ON co.country_id = COALESCE(agg.primary_country_id, j.country_id)
    LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
    ORDER BY j.job_id DESC;

  ELSEIF p_action = 'LIST_BY_PARTNER' THEN
    SELECT
      j.job_id,
      j.job_code,
      j.job_title,
      j.category_id,
      c.category_name,
      COALESCE(agg.primary_country_id, j.country_id) AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      COALESCE(agg.total_vacancy, j.vacancy) AS vacancy,
      COALESCE(agg.salary_min, j.salary_min) AS salary_min,
      COALESCE(agg.salary_max, j.salary_max) AS salary_max,
      j.partner_id,
      p.partner_name,
      j.employment_type_id,
      et.type_name AS employment_type_name,
      j.work_mode_id,
      wm.mode_name AS work_mode_name,
      j.currency_id,
      cur.currency_code,
      cur.currency_name,
      cur.symbol,
      j.min_education,
      j.skills,
      j.min_experience,
      j.min_age,
      j.max_age,
      j.gender_requirement,
      j.trade_test_required,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN JOB_M03_employment_types et ON et.employment_type_id = j.employment_type_id
    LEFT JOIN JOB_M04_work_modes wm ON wm.work_mode_id = j.work_mode_id
    LEFT JOIN PAY_M02_currencies cur ON cur.currency_id = j.currency_id
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
    LEFT JOIN LOC_M01_countries co ON co.country_id = COALESCE(agg.primary_country_id, j.country_id)
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
      COALESCE(agg.primary_country_id, j.country_id) AS country_id,
      co.country_name,
      j.contract_duration_id,
      d.duration_name,
      d.months,
      COALESCE(agg.total_vacancy, j.vacancy) AS vacancy,
      COALESCE(agg.salary_min, j.salary_min) AS salary_min,
      COALESCE(agg.salary_max, j.salary_max) AS salary_max,
      j.job_description,
      j.partner_id,
      p.partner_name,
      j.employment_type_id,
      et.type_name AS employment_type_name,
      j.work_mode_id,
      wm.mode_name AS work_mode_name,
      j.currency_id,
      cur.currency_code,
      cur.currency_name,
      cur.symbol,
      j.compensation_text,
      j.min_education,
      j.skills,
      j.min_experience,
      j.min_age,
      j.max_age,
      j.gender_requirement,
      j.trade_test_required,
      j.status,
      j.created_by,
      j.created_at
    FROM JOB_T01_jobs j
    LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
    LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
    LEFT JOIN JOB_M03_employment_types et ON et.employment_type_id = j.employment_type_id
    LEFT JOIN JOB_M04_work_modes wm ON wm.work_mode_id = j.work_mode_id
    LEFT JOIN PAY_M02_currencies cur ON cur.currency_id = j.currency_id
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
    LEFT JOIN LOC_M01_countries co ON co.country_id = COALESCE(agg.primary_country_id, j.country_id)
    LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
    WHERE j.job_id = p_job_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T01_jobs (
      job_code, job_title, category_id, country_id, contract_duration_id,
      vacancy, salary_min, salary_max, job_description, partner_id, employment_type_id,
      work_mode_id, currency_id, compensation_text, min_education, skills, min_experience,
      min_age, max_age, gender_requirement, trade_test_required, status, created_by
    ) VALUES (
      NULLIF(p_job_code, ''), p_job_title, p_category_id, p_country_id, p_contract_duration_id,
      p_vacancy, p_salary_min, p_salary_max, p_job_description, p_partner_id, p_employment_type_id,
      p_work_mode_id, p_currency_id, p_compensation_text, p_min_education, p_skills, p_min_experience,
      p_min_age, p_max_age, p_gender_requirement, COALESCE(p_trade_test_required, FALSE), COALESCE(NULLIF(p_status,''), 'Open'), p_created_by
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
      employment_type_id = COALESCE(p_employment_type_id, employment_type_id),
      work_mode_id = COALESCE(p_work_mode_id, work_mode_id),
      currency_id = COALESCE(p_currency_id, currency_id),
      compensation_text = COALESCE(p_compensation_text, compensation_text),
      min_education = COALESCE(p_min_education, min_education),
      skills = COALESCE(p_skills, skills),
      min_experience = COALESCE(p_min_experience, min_experience),
      min_age = COALESCE(p_min_age, min_age),
      max_age = COALESCE(p_max_age, max_age),
      gender_requirement = COALESCE(p_gender_requirement, gender_requirement),
      trade_test_required = COALESCE(p_trade_test_required, trade_test_required),
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
DELIMITER ;
