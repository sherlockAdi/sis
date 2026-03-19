-- ============================================
-- JOB Transactions Schema + Procedures
-- NOTE: API must access DB via procedures only.
-- ============================================

-- ============================================
-- JOB_T01_jobs (Main Job Table)
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T01_jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,

    job_code VARCHAR(20) UNIQUE,

    job_title VARCHAR(150) NOT NULL,
    category_id INT,
    country_id INT,

    contract_duration_id INT,
    vacancy INT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),

    job_description TEXT,

    status VARCHAR(50) DEFAULT 'Open',

    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES JOB_M01_job_categories(category_id),
    FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
    FOREIGN KEY (contract_duration_id) REFERENCES JOB_M02_contract_durations(duration_id)
);


-- ============================================
-- JOB_T02_job_requirements
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T02_job_requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    location_id INT DEFAULT NULL,

    requirement TEXT NOT NULL,

    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES JOB_T05_job_locations(id) ON DELETE CASCADE
);


-- ============================================
-- JOB_T03_job_benefits
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T03_job_benefits (
    benefit_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    location_id INT DEFAULT NULL,

    benefit TEXT NOT NULL,

    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES JOB_T05_job_locations(id) ON DELETE CASCADE
);


-- ============================================
-- JOB_T04_job_documents
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T04_job_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    document_type_id INT NOT NULL,

    is_required BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES DOC_M01_document_types(document_type_id)
);


-- ============================================
-- JOB_T05_job_locations
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T05_job_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,

    country_id INT,
    state_id INT,
    city_id INT,

    vacancy INT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),

    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
    FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
    FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id)
);


-- ============================================
-- JOB_T06_job_status_history
-- ============================================

CREATE TABLE IF NOT EXISTS JOB_T06_job_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,

    status VARCHAR(50),
    remarks VARCHAR(255),

    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE
);


-- ============================================
-- Stored Procedures
-- 1 procedure per table (multi-action)
-- ============================================

DELIMITER $$

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
    WHERE j.job_id = p_job_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T01_jobs (
      job_code, job_title, category_id, country_id, contract_duration_id,
      vacancy, salary_min, salary_max, job_description, status, created_by
    ) VALUES (
      NULLIF(p_job_code, ''), p_job_title, p_category_id, p_country_id, p_contract_duration_id,
      p_vacancy, p_salary_min, p_salary_max, p_job_description, COALESCE(NULLIF(p_status,''), 'Open'), p_created_by
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


DROP PROCEDURE IF EXISTS sp_job_requirements $$
CREATE PROCEDURE sp_job_requirements(
  IN p_action VARCHAR(30),
  IN p_requirement_id INT,
  IN p_job_id INT,
  IN p_location_id INT,
  IN p_requirement TEXT
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT requirement_id, job_id, location_id, requirement
    FROM JOB_T02_job_requirements
    WHERE job_id = p_job_id
      AND (p_location_id IS NULL OR location_id = p_location_id)
    ORDER BY requirement_id ASC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T02_job_requirements (job_id, location_id, requirement)
    VALUES (p_job_id, p_location_id, p_requirement);
    SELECT LAST_INSERT_ID() AS requirement_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE JOB_T02_job_requirements
    SET
      location_id = COALESCE(p_location_id, location_id),
      requirement = COALESCE(p_requirement, requirement)
    WHERE requirement_id = p_requirement_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T02_job_requirements WHERE requirement_id = p_requirement_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_JOB' THEN
    DELETE FROM JOB_T02_job_requirements WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_LOCATION' THEN
    DELETE FROM JOB_T02_job_requirements WHERE job_id = p_job_id AND location_id = p_location_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_requirements: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_job_benefits $$
CREATE PROCEDURE sp_job_benefits(
  IN p_action VARCHAR(30),
  IN p_benefit_id INT,
  IN p_job_id INT,
  IN p_location_id INT,
  IN p_benefit TEXT
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT benefit_id, job_id, location_id, benefit
    FROM JOB_T03_job_benefits
    WHERE job_id = p_job_id
      AND (p_location_id IS NULL OR location_id = p_location_id)
    ORDER BY benefit_id ASC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T03_job_benefits (job_id, location_id, benefit)
    VALUES (p_job_id, p_location_id, p_benefit);
    SELECT LAST_INSERT_ID() AS benefit_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE JOB_T03_job_benefits
    SET
      location_id = COALESCE(p_location_id, location_id),
      benefit = COALESCE(p_benefit, benefit)
    WHERE benefit_id = p_benefit_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T03_job_benefits WHERE benefit_id = p_benefit_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_JOB' THEN
    DELETE FROM JOB_T03_job_benefits WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_LOCATION' THEN
    DELETE FROM JOB_T03_job_benefits WHERE job_id = p_job_id AND location_id = p_location_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_benefits: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_job_documents $$
CREATE PROCEDURE sp_job_documents(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_job_id INT,
  IN p_document_type_id INT,
  IN p_is_required BOOLEAN
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT
      jd.id,
      jd.job_id,
      jd.document_type_id,
      dt.document_name,
      jd.is_required
    FROM JOB_T04_job_documents jd
    JOIN DOC_M01_document_types dt ON dt.document_type_id = jd.document_type_id
    WHERE jd.job_id = p_job_id
    ORDER BY jd.id ASC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T04_job_documents (job_id, document_type_id, is_required)
    VALUES (p_job_id, p_document_type_id, COALESCE(p_is_required, TRUE));
    SELECT LAST_INSERT_ID() AS id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE JOB_T04_job_documents
    SET
      document_type_id = COALESCE(p_document_type_id, document_type_id),
      is_required = COALESCE(p_is_required, is_required)
    WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T04_job_documents WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_JOB' THEN
    DELETE FROM JOB_T04_job_documents WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_documents: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_job_locations $$
CREATE PROCEDURE sp_job_locations(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_job_id INT,
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_vacancy INT,
  IN p_salary_min DECIMAL(10,2),
  IN p_salary_max DECIMAL(10,2)
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT
      jl.id,
      jl.job_id,
      jl.country_id,
      co.country_name,
      jl.state_id,
      st.state_name,
      jl.city_id,
      ci.city_name,
      jl.vacancy,
      jl.salary_min,
      jl.salary_max
    FROM JOB_T05_job_locations jl
    LEFT JOIN LOC_M01_countries co ON co.country_id = jl.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = jl.state_id
    LEFT JOIN LOC_M03_cities ci ON ci.city_id = jl.city_id
    WHERE jl.job_id = p_job_id
    ORDER BY jl.id ASC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T05_job_locations (job_id, country_id, state_id, city_id, vacancy, salary_min, salary_max)
    VALUES (p_job_id, p_country_id, p_state_id, p_city_id, p_vacancy, p_salary_min, p_salary_max);
    SELECT LAST_INSERT_ID() AS id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE JOB_T05_job_locations
    SET
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      vacancy = COALESCE(p_vacancy, vacancy),
      salary_min = COALESCE(p_salary_min, salary_min),
      salary_max = COALESCE(p_salary_max, salary_max)
    WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T05_job_locations WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE_BY_JOB' THEN
    DELETE FROM JOB_T05_job_locations WHERE job_id = p_job_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_locations: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_job_status_history $$
CREATE PROCEDURE sp_job_status_history(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_job_id INT,
  IN p_status VARCHAR(50),
  IN p_remarks VARCHAR(255),
  IN p_changed_by INT
)
BEGIN
  IF p_action = 'LIST_BY_JOB' THEN
    SELECT id, job_id, status, remarks, changed_by, changed_at
    FROM JOB_T06_job_status_history
    WHERE job_id = p_job_id
    ORDER BY changed_at DESC, id DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO JOB_T06_job_status_history (job_id, status, remarks, changed_by)
    VALUES (p_job_id, p_status, p_remarks, p_changed_by);
    SELECT LAST_INSERT_ID() AS id;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM JOB_T06_job_status_history WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_job_status_history: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_job_jobs_search $$
CREATE PROCEDURE sp_job_jobs_search(
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_category_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  SELECT
    j.job_id,
    j.job_code,
    j.job_title,
    j.category_id,
    c.category_name,
    MIN(l.country_id) AS country_id,
    MIN(co.country_name) AS country_name,
    j.contract_duration_id,
    d.duration_name,
    d.months,
    SUM(COALESCE(l.vacancy,0)) AS vacancy,
    MIN(l.salary_min) AS salary_min,
    MAX(l.salary_max) AS salary_max,
    j.status,
    j.created_by,
    j.created_at
  FROM JOB_T01_jobs j
  LEFT JOIN JOB_M01_job_categories c ON c.category_id = j.category_id
  LEFT JOIN JOB_M02_contract_durations d ON d.duration_id = j.contract_duration_id
  JOIN JOB_T05_job_locations l ON l.job_id = j.job_id
  LEFT JOIN LOC_M01_countries co ON co.country_id = l.country_id
  WHERE (p_category_id IS NULL OR j.category_id = p_category_id)
    AND (p_status IS NULL OR p_status = '' OR j.status = p_status)
    AND (p_country_id IS NULL OR l.country_id = p_country_id)
    AND (p_state_id IS NULL OR l.state_id = p_state_id)
    AND (p_city_id IS NULL OR l.city_id = p_city_id)
  GROUP BY
    j.job_id, j.job_code, j.job_title, j.category_id, c.category_name,
    j.contract_duration_id, d.duration_name, d.months,
    j.status, j.created_by, j.created_at
  ORDER BY j.job_id DESC;
END $$

DELIMITER ;
