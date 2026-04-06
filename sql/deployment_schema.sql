-- ============================================
-- Deployment Transactions Schema + Procedures
-- NOTE: API must access DB via procedures only.
-- ============================================

-- ============================================
-- DEP_T01_deployments
-- ============================================

CREATE TABLE IF NOT EXISTS DEP_T01_deployments (
    deployment_id INT AUTO_INCREMENT PRIMARY KEY,

    application_id INT NOT NULL UNIQUE,

    current_status VARCHAR(50) DEFAULT 'Ready',
    visa_type_id INT DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,

    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES REC_T02_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (visa_type_id) REFERENCES REC_M02_visa_types(visa_type_id),
    FOREIGN KEY (created_by) REFERENCES AUTH_U04_users(user_id),
    FOREIGN KEY (updated_by) REFERENCES AUTH_U04_users(user_id)
);


-- ============================================
-- DEP_T02_deployment_history
-- ============================================

CREATE TABLE IF NOT EXISTS DEP_T02_deployment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    deployment_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    remarks VARCHAR(255) DEFAULT NULL,

    changed_by INT DEFAULT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (deployment_id) REFERENCES DEP_T01_deployments(deployment_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES AUTH_U04_users(user_id)
);


-- ============================================
-- DEP_T03_visa_details
-- ============================================

CREATE TABLE IF NOT EXISTS DEP_T03_visa_details (
    visa_detail_id INT AUTO_INCREMENT PRIMARY KEY,

    deployment_id INT NOT NULL UNIQUE,

    visa_type_id INT DEFAULT NULL,
    visa_number VARCHAR(100) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    expiry_date DATE DEFAULT NULL,

    passport_number VARCHAR(100) DEFAULT NULL,
    passport_issue_date DATE DEFAULT NULL,
    passport_expiry_date DATE DEFAULT NULL,

    sponsor_id VARCHAR(100) DEFAULT NULL,
    sponsor_contact VARCHAR(100) DEFAULT NULL,

    passport_file_path TEXT DEFAULT NULL,
    visa_file_path TEXT DEFAULT NULL,

    remarks VARCHAR(255) DEFAULT NULL,

    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (deployment_id) REFERENCES DEP_T01_deployments(deployment_id) ON DELETE CASCADE,
    FOREIGN KEY (visa_type_id) REFERENCES REC_M02_visa_types(visa_type_id),
    FOREIGN KEY (created_by) REFERENCES AUTH_U04_users(user_id),
    FOREIGN KEY (updated_by) REFERENCES AUTH_U04_users(user_id)
);


-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_dep_deployments $$
CREATE PROCEDURE sp_dep_deployments(
  IN p_action VARCHAR(30),
  IN p_deployment_id INT,
  IN p_application_id INT,
  IN p_status VARCHAR(50),
  IN p_visa_type_id INT,
  IN p_remarks VARCHAR(255),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      d.deployment_id,
      d.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      d.current_status,
      d.visa_type_id,
      v.visa_type_name,
      d.remarks,
      d.created_at,
      d.updated_at
    FROM DEP_T01_deployments d
    JOIN REC_T02_applications a ON a.application_id = d.application_id
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    LEFT JOIN REC_M02_visa_types v ON v.visa_type_id = d.visa_type_id
    ORDER BY d.deployment_id DESC;

  ELSEIF p_action = 'LIST_BY_STATUS' THEN
    SELECT
      d.deployment_id,
      d.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      d.current_status,
      d.visa_type_id,
      v.visa_type_name,
      d.remarks,
      d.created_at,
      d.updated_at
    FROM DEP_T01_deployments d
    JOIN REC_T02_applications a ON a.application_id = d.application_id
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    LEFT JOIN REC_M02_visa_types v ON v.visa_type_id = d.visa_type_id
    WHERE d.current_status = p_status
    ORDER BY d.deployment_id DESC;

  ELSEIF p_action = 'LIST_BY_CANDIDATE' THEN
    SELECT
      d.deployment_id,
      d.application_id,
      a.candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
      c.phone,
      c.email,
      a.job_id,
      j.job_title,
      j.job_code,
      d.current_status,
      d.visa_type_id,
      v.visa_type_name,
      d.remarks,
      d.created_at,
      d.updated_at
    FROM DEP_T01_deployments d
    JOIN REC_T02_applications a ON a.application_id = d.application_id
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    LEFT JOIN REC_M02_visa_types v ON v.visa_type_id = d.visa_type_id
    WHERE a.candidate_id = p_application_id
    ORDER BY d.deployment_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT * FROM DEP_T01_deployments WHERE deployment_id = p_deployment_id LIMIT 1;

  ELSEIF p_action = 'GET_BY_APPLICATION' THEN
    SELECT * FROM DEP_T01_deployments WHERE application_id = p_application_id LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    BEGIN
      DECLARE v_existing_id INT DEFAULT NULL;
      SELECT deployment_id INTO v_existing_id
      FROM DEP_T01_deployments
      WHERE application_id = p_application_id
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        SELECT v_existing_id AS deployment_id;
      ELSE
        INSERT INTO DEP_T01_deployments (
          application_id, current_status, visa_type_id, remarks, created_by, updated_by
        ) VALUES (
          p_application_id,
          COALESCE(NULLIF(p_status,''), 'Ready'),
          p_visa_type_id,
          p_remarks,
          p_user_id,
          p_user_id
        );
        SET @new_id := LAST_INSERT_ID();
        INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
        VALUES (@new_id, COALESCE(NULLIF(p_status,''), 'Ready'), p_remarks, p_user_id);
        SELECT @new_id AS deployment_id;
      END IF;
    END;

  ELSEIF p_action = 'SET_STATUS' THEN
    UPDATE DEP_T01_deployments
    SET
      current_status = COALESCE(NULLIF(p_status,''), current_status),
      visa_type_id = COALESCE(p_visa_type_id, visa_type_id),
      remarks = COALESCE(p_remarks, remarks),
      updated_by = p_user_id
    WHERE deployment_id = p_deployment_id;

    INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
    VALUES (p_deployment_id, COALESCE(NULLIF(p_status,''), current_status), p_remarks, p_user_id);

    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM DEP_T01_deployments WHERE deployment_id = p_deployment_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_dep_deployments: invalid action';
  END IF;
END $$


DROP PROCEDURE IF EXISTS sp_dep_deployment_history $$
CREATE PROCEDURE sp_dep_deployment_history(
  IN p_action VARCHAR(30),
  IN p_id INT,
  IN p_deployment_id INT,
  IN p_status VARCHAR(50),
  IN p_remarks VARCHAR(255),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'LIST_BY_DEPLOYMENT' THEN
    SELECT id, deployment_id, status, remarks, changed_by, changed_at
    FROM DEP_T02_deployment_history
    WHERE deployment_id = p_deployment_id
    ORDER BY changed_at DESC;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
    VALUES (p_deployment_id, p_status, p_remarks, p_user_id);
    SELECT LAST_INSERT_ID() AS id;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_dep_deployment_history: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_dep_visa_details $$
CREATE PROCEDURE sp_dep_visa_details(
  IN p_action VARCHAR(30),
  IN p_visa_detail_id INT,
  IN p_deployment_id INT,
  IN p_visa_type_id INT,
  IN p_visa_number VARCHAR(100),
  IN p_issue_date DATE,
  IN p_expiry_date DATE,
  IN p_passport_number VARCHAR(100),
  IN p_passport_issue_date DATE,
  IN p_passport_expiry_date DATE,
  IN p_sponsor_id VARCHAR(100),
  IN p_sponsor_contact VARCHAR(100),
  IN p_passport_file_path TEXT,
  IN p_visa_file_path TEXT,
  IN p_remarks VARCHAR(255),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'GET_BY_DEPLOYMENT' THEN
    SELECT * FROM DEP_T03_visa_details WHERE deployment_id = p_deployment_id LIMIT 1;

  ELSEIF p_action = 'UPSERT' THEN
    BEGIN
      DECLARE v_existing_id INT DEFAULT NULL;
      SELECT visa_detail_id INTO v_existing_id
      FROM DEP_T03_visa_details
      WHERE deployment_id = p_deployment_id
      LIMIT 1;

      IF v_existing_id IS NULL THEN
        INSERT INTO DEP_T03_visa_details (
          deployment_id, visa_type_id, visa_number, issue_date, expiry_date,
          passport_number, passport_issue_date, passport_expiry_date,
          sponsor_id, sponsor_contact,
          passport_file_path, visa_file_path, remarks,
          created_by, updated_by
        ) VALUES (
          p_deployment_id, p_visa_type_id, p_visa_number, p_issue_date, p_expiry_date,
          p_passport_number, p_passport_issue_date, p_passport_expiry_date,
          p_sponsor_id, p_sponsor_contact,
          p_passport_file_path, p_visa_file_path, p_remarks,
          p_user_id, p_user_id
        );
        SELECT LAST_INSERT_ID() AS visa_detail_id;
      ELSE
        UPDATE DEP_T03_visa_details
        SET
          visa_type_id = COALESCE(p_visa_type_id, visa_type_id),
          visa_number = COALESCE(p_visa_number, visa_number),
          issue_date = COALESCE(p_issue_date, issue_date),
          expiry_date = COALESCE(p_expiry_date, expiry_date),
          passport_number = COALESCE(p_passport_number, passport_number),
          passport_issue_date = COALESCE(p_passport_issue_date, passport_issue_date),
          passport_expiry_date = COALESCE(p_passport_expiry_date, passport_expiry_date),
          sponsor_id = COALESCE(p_sponsor_id, sponsor_id),
          sponsor_contact = COALESCE(p_sponsor_contact, sponsor_contact),
          passport_file_path = COALESCE(p_passport_file_path, passport_file_path),
          visa_file_path = COALESCE(p_visa_file_path, visa_file_path),
          remarks = COALESCE(p_remarks, remarks),
          updated_by = p_user_id
        WHERE visa_detail_id = v_existing_id;
        SELECT v_existing_id AS visa_detail_id;
      END IF;
    END;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_dep_visa_details: invalid action';
  END IF;
END $$

DELIMITER ;
