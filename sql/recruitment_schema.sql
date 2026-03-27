-- ============================================
-- Recruitment Transactions Schema + Procedures
-- NOTE: API must access DB via procedures only.
-- ============================================

-- ============================================
-- REC_T01_candidates
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T01_candidates (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_code VARCHAR(20) UNIQUE,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    phone VARCHAR(20),
    email VARCHAR(150),

    passport_number VARCHAR(50),

    country_id INT,
    state_id INT,
    city_id INT,

    status VARCHAR(50) DEFAULT 'New',

    user_id INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
    FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
    FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id),
    FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id)
);


-- ============================================
-- REC_T02_applications
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T02_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT NOT NULL,
    job_id INT NOT NULL,

    application_date DATE,
    status VARCHAR(50) DEFAULT 'Applied',

    FOREIGN KEY (candidate_id) REFERENCES REC_T01_candidates(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id)
);


-- ============================================
-- REC_T03_candidate_journey
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T03_candidate_journey (
    journey_id INT AUTO_INCREMENT PRIMARY KEY,

    application_id INT,

    stage VARCHAR(100),
    remarks VARCHAR(255),

    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES REC_T02_applications(application_id) ON DELETE CASCADE
);


-- ============================================
-- REC_T04_interviews
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T04_interviews (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,

    application_id INT,
    interview_mode_id INT,

    interview_date DATETIME,
    result VARCHAR(50),

    remarks VARCHAR(255),

    FOREIGN KEY (application_id) REFERENCES REC_T02_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (interview_mode_id) REFERENCES REC_M01_interview_modes(interview_mode_id)
);


-- ============================================
-- REC_T05_candidate_documents
-- - Stored per candidate (not per application).
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T05_candidate_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT,
    document_type_id INT,

    file_path TEXT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id) REFERENCES REC_T01_candidates(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES DOC_M01_document_types(document_type_id),

    UNIQUE(candidate_id, document_type_id)
);


-- ============================================
-- REC_T06_candidate_status_history
-- ============================================

CREATE TABLE IF NOT EXISTS REC_T06_candidate_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT,
    status VARCHAR(50),
    remarks VARCHAR(255),

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id) REFERENCES REC_T01_candidates(candidate_id) ON DELETE CASCADE
);


-- ============================================
-- Stored Procedures (1 per table, multi-action)
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_candidates $$
CREATE PROCEDURE sp_rec_candidates(
  IN p_action VARCHAR(30),
  IN p_candidate_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_passport_number VARCHAR(50),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_status VARCHAR(50),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      c.candidate_id,
      c.candidate_code,
      c.first_name,
      c.last_name,
      c.phone,
      c.email,
      c.passport_number,
      c.country_id,
      co.country_name,
      c.state_id,
      st.state_name,
      c.city_id,
      ci.city_name,
      c.status,
      c.user_id,
      c.created_at
    FROM REC_T01_candidates c
    LEFT JOIN LOC_M01_countries co ON co.country_id = c.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = c.state_id
    LEFT JOIN LOC_M03_cities ci ON ci.city_id = c.city_id
    ORDER BY c.candidate_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT * FROM REC_T01_candidates WHERE candidate_id = p_candidate_id LIMIT 1;

  ELSEIF p_action = 'GET_BY_USER' THEN
    SELECT * FROM REC_T01_candidates WHERE user_id = p_user_id LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO REC_T01_candidates (
      candidate_code, first_name, last_name, phone, email, passport_number,
      country_id, state_id, city_id, status, user_id
    ) VALUES (
      NULL, p_first_name, p_last_name, p_phone, p_email, p_passport_number,
      p_country_id, p_state_id, p_city_id, COALESCE(NULLIF(p_status,''), 'New'), p_user_id
    );
    SET @new_id := LAST_INSERT_ID();
    UPDATE REC_T01_candidates
    SET candidate_code = CONCAT('C', LPAD(@new_id, 6, '0'))
    WHERE candidate_id = @new_id;
    SELECT @new_id AS candidate_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE REC_T01_candidates
    SET
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      passport_number = COALESCE(p_passport_number, passport_number),
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      status = COALESCE(NULLIF(p_status,''), status),
      user_id = COALESCE(p_user_id, user_id)
    WHERE candidate_id = p_candidate_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_USER' THEN
    UPDATE REC_T01_candidates
    SET user_id = p_user_id
    WHERE candidate_id = p_candidate_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T01_candidates WHERE candidate_id = p_candidate_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_candidates: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_rec_applications $$
CREATE PROCEDURE sp_rec_applications(
  IN p_action VARCHAR(30),
  IN p_application_id INT,
  IN p_candidate_id INT,
  IN p_job_id INT,
  IN p_application_date DATE,
  IN p_status VARCHAR(50)
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


DROP PROCEDURE IF EXISTS sp_rec_candidate_documents $$
CREATE PROCEDURE sp_rec_candidate_documents(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_candidate_id INT,
  IN p_document_type_id INT,
  IN p_file_path TEXT
)
BEGIN
  IF p_action = 'LIST_BY_CANDIDATE' THEN
    SELECT id, NULL AS application_id, candidate_id, document_type_id, file_path, uploaded_at
    FROM REC_T05_candidate_documents
    WHERE candidate_id = p_candidate_id
    ORDER BY uploaded_at DESC;

  ELSEIF p_action = 'UPSERT' THEN
    INSERT INTO REC_T05_candidate_documents (candidate_id, document_type_id, file_path)
    VALUES (p_candidate_id, p_document_type_id, p_file_path)
    ON DUPLICATE KEY UPDATE
      file_path = VALUES(file_path),
      uploaded_at = CURRENT_TIMESTAMP;
    SELECT 1 AS ok;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T05_candidate_documents WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_candidate_documents: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_rec_application_documents $$
CREATE PROCEDURE sp_rec_application_documents(IN p_application_id INT)
BEGIN
  DECLARE v_job_id INT DEFAULT NULL;
  DECLARE v_candidate_id INT DEFAULT NULL;

  SELECT job_id, candidate_id INTO v_job_id, v_candidate_id
  FROM REC_T02_applications
  WHERE application_id = p_application_id
  LIMIT 1;

  SELECT
    dt.document_type_id,
    dt.document_name,
    jd.is_required AS job_is_required,
    cd.id AS candidate_document_id,
    cd.file_path,
    cd.uploaded_at
  FROM JOB_T04_job_documents jd
  JOIN DOC_M01_document_types dt ON dt.document_type_id = jd.document_type_id
  LEFT JOIN REC_T05_candidate_documents cd
    ON cd.document_type_id = jd.document_type_id
   AND cd.candidate_id = v_candidate_id
  WHERE jd.job_id = v_job_id
  ORDER BY dt.document_name ASC;
END $$

DROP PROCEDURE IF EXISTS sp_rec_candidate_journey $$
CREATE PROCEDURE sp_rec_candidate_journey(
  IN p_action VARCHAR(30),
  IN p_journey_id INT,
  IN p_application_id INT,
  IN p_stage VARCHAR(100),
  IN p_remarks VARCHAR(255),
  IN p_updated_by INT
)
BEGIN
  IF p_action = 'LIST_BY_APPLICATION' THEN
    SELECT journey_id, application_id, stage, remarks, updated_by, updated_at
    FROM REC_T03_candidate_journey
    WHERE application_id = p_application_id
    ORDER BY updated_at DESC, journey_id DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO REC_T03_candidate_journey (application_id, stage, remarks, updated_by)
    VALUES (p_application_id, p_stage, p_remarks, p_updated_by);
    SELECT LAST_INSERT_ID() AS journey_id;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T03_candidate_journey WHERE journey_id = p_journey_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_candidate_journey: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_rec_interviews $$
CREATE PROCEDURE sp_rec_interviews(
  IN p_action VARCHAR(30),
  IN p_interview_id INT,
  IN p_application_id INT,
  IN p_interview_mode_id INT,
  IN p_interview_date DATETIME,
  IN p_result VARCHAR(50),
  IN p_remarks VARCHAR(255)
)
BEGIN
  IF p_action = 'LIST_BY_APPLICATION' THEN
    SELECT
      i.interview_id,
      i.application_id,
      i.interview_mode_id,
      m.mode_name,
      i.interview_date,
      i.result,
      i.remarks
    FROM REC_T04_interviews i
    LEFT JOIN REC_M01_interview_modes m ON m.interview_mode_id = i.interview_mode_id
    WHERE i.application_id = p_application_id
    ORDER BY i.interview_date DESC, i.interview_id DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO REC_T04_interviews (application_id, interview_mode_id, interview_date, result, remarks)
    VALUES (p_application_id, p_interview_mode_id, p_interview_date, p_result, p_remarks);
    SELECT LAST_INSERT_ID() AS interview_id;

  ELSEIF p_action = 'UPDATE' THEN
    UPDATE REC_T04_interviews
    SET
      interview_mode_id = COALESCE(p_interview_mode_id, interview_mode_id),
      interview_date = COALESCE(p_interview_date, interview_date),
      result = COALESCE(p_result, result),
      remarks = COALESCE(p_remarks, remarks)
    WHERE interview_id = p_interview_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T04_interviews WHERE interview_id = p_interview_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_interviews: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_rec_candidate_status_history $$
CREATE PROCEDURE sp_rec_candidate_status_history(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_candidate_id INT,
  IN p_status VARCHAR(50),
  IN p_remarks VARCHAR(255)
)
BEGIN
  IF p_action = 'LIST_BY_CANDIDATE' THEN
    SELECT id, candidate_id, status, remarks, changed_at
    FROM REC_T06_candidate_status_history
    WHERE candidate_id = p_candidate_id
    ORDER BY changed_at DESC, id DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO REC_T06_candidate_status_history (candidate_id, status, remarks)
    VALUES (p_candidate_id, p_status, p_remarks);
    SELECT LAST_INSERT_ID() AS id;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM REC_T06_candidate_status_history WHERE id = p_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_candidate_status_history: invalid action';
  END IF;
END $$

DELIMITER ;
