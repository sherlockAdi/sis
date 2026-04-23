DROP PROCEDURE IF EXISTS sp_dep_deployments;

DELIMITER $$

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
  DECLARE v_current_status VARCHAR(50) DEFAULT NULL;

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
    SELECT current_status INTO v_current_status
    FROM DEP_T01_deployments
    WHERE deployment_id = p_deployment_id
    LIMIT 1;

    UPDATE DEP_T01_deployments
    SET
      current_status = COALESCE(NULLIF(p_status,''), current_status),
      visa_type_id = COALESCE(p_visa_type_id, visa_type_id),
      remarks = COALESCE(p_remarks, remarks),
      updated_by = p_user_id
    WHERE deployment_id = p_deployment_id;

    INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
    VALUES (p_deployment_id, COALESCE(NULLIF(p_status,''), v_current_status, 'Ready'), p_remarks, p_user_id);

    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM DEP_T01_deployments WHERE deployment_id = p_deployment_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_dep_deployments: invalid action';
  END IF;
END $$

DELIMITER ;
