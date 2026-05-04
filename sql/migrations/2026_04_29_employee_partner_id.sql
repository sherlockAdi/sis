-- Store the owning partner on converted employee records.

ALTER TABLE EMP_T01_employees
  ADD COLUMN partner_id INT DEFAULT NULL AFTER deployment_id;

UPDATE EMP_T01_employees e
JOIN DEP_T01_deployments d ON d.deployment_id = e.deployment_id
JOIN REC_T02_applications a ON a.application_id = d.application_id
JOIN JOB_T01_jobs j ON j.job_id = a.job_id
SET e.partner_id = j.partner_id
WHERE e.partner_id IS NULL;

DROP PROCEDURE IF EXISTS sp_emp_employees;
DELIMITER $$
CREATE PROCEDURE sp_emp_employees(
  IN p_action VARCHAR(30),
  IN p_employee_id INT,
  IN p_deployment_id INT,
  IN p_employee_code VARCHAR(50),
  IN p_employee_name VARCHAR(200),
  IN p_employee_contact_number VARCHAR(30),
  IN p_address1 VARCHAR(255),
  IN p_address2 VARCHAR(255),
  IN p_pin_code VARCHAR(20),
  IN p_industry VARCHAR(150),
  IN p_work_location VARCHAR(255),
  IN p_employment_status VARCHAR(50),
  IN p_date_of_joining DATE,
  IN p_date_of_confirmation DATE,
  IN p_candidate_id INT,
  IN p_shift_timing VARCHAR(100),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT
      e.employee_id,
      e.employee_code,
      e.employee_name,
      e.employee_contact_number,
      e.address1,
      e.address2,
      e.pin_code,
      e.industry,
      e.work_location,
      e.employment_status,
      e.date_of_joining,
      e.date_of_confirmation,
      e.candidate_id,
      e.deployment_id,
      e.partner_id,
      e.shift_timing,
      e.created_at,
      e.updated_at,
      e.deleted_at,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.passport_number
    FROM EMP_T01_employees e
    JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
    ORDER BY e.employee_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT
      e.*,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.passport_number,
      c.dob,
      c.gender,
      c.skills,
      c.education,
      c.experience,
      c.industry_type,
      c.resume_file_path,
      c.passport_expiry_date,
      c.passport_file_path,
      c.aadhar_number,
      c.aadhar_file_path,
      c.pan_number,
      c.pan_file_path,
      c.voter_id_number,
      c.voter_id_file_path,
      c.profile_photo_file_path,
      c.languages_known,
      c.address1 AS candidate_address1,
      c.address2 AS candidate_address2,
      c.pincode AS candidate_pincode
    FROM EMP_T01_employees e
    JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
    WHERE e.employee_id = p_employee_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE_FROM_DEPLOYMENT' THEN
    BEGIN
      DECLARE v_candidate_id INT DEFAULT NULL;
      DECLARE v_user_id INT DEFAULT NULL;
      DECLARE v_employee_role_id INT DEFAULT NULL;
      DECLARE v_employee_id INT DEFAULT NULL;
      DECLARE v_employee_code VARCHAR(50) DEFAULT NULL;
      DECLARE v_employee_name VARCHAR(200) DEFAULT NULL;
      DECLARE v_contact VARCHAR(30) DEFAULT NULL;
      DECLARE v_address1 VARCHAR(255) DEFAULT NULL;
      DECLARE v_address2 VARCHAR(255) DEFAULT NULL;
      DECLARE v_pin_code VARCHAR(20) DEFAULT NULL;
      DECLARE v_industry VARCHAR(150) DEFAULT NULL;
      DECLARE v_work_location VARCHAR(255) DEFAULT NULL;
      DECLARE v_partner_id INT DEFAULT NULL;
      DECLARE v_candidate_code VARCHAR(50) DEFAULT NULL;

      SELECT d.deployment_id, a.candidate_id, c.candidate_code, c.passport_number, CONCAT_WS(' ', c.first_name, c.last_name),
             c.phone, c.address1, c.address2, c.pincode, c.industry_type,
             COALESCE(ci.city_name, st.state_name, co.country_name, j.job_title),
             j.partner_id
      INTO p_deployment_id, v_candidate_id, v_candidate_code, v_employee_code, v_employee_name,
           v_contact, v_address1, v_address2, v_pin_code, v_industry, v_work_location, v_partner_id
      FROM DEP_T01_deployments d
      JOIN REC_T02_applications a ON a.application_id = d.application_id
      JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
      JOIN JOB_T01_jobs j ON j.job_id = a.job_id
      LEFT JOIN JOB_T05_job_locations loc_row ON loc_row.job_id = j.job_id
      LEFT JOIN LOC_M03_cities ci ON ci.city_id = loc_row.city_id
      LEFT JOIN LOC_M02_states st ON st.state_id = loc_row.state_id
      LEFT JOIN LOC_M01_countries co ON co.country_id = loc_row.country_id
      WHERE d.deployment_id = p_deployment_id
      LIMIT 1;

      IF v_candidate_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_employees: deployment candidate not found';
      END IF;

      SELECT user_id INTO v_user_id
      FROM REC_T01_candidates
      WHERE candidate_id = v_candidate_id
      LIMIT 1;

      IF v_user_id IS NULL THEN
        SELECT u.user_id INTO v_user_id
        FROM AUTH_U04_users u
        JOIN REC_T01_candidates c ON c.candidate_id = v_candidate_id
        WHERE (c.candidate_code IS NOT NULL AND c.candidate_code <> '' AND u.username = c.candidate_code)
           OR (c.email IS NOT NULL AND c.email <> '' AND u.email = c.email)
           OR (c.email IS NOT NULL AND c.email <> '' AND u.username = c.email)
        ORDER BY u.user_id ASC
        LIMIT 1;
      END IF;

      SELECT role_id INTO v_employee_role_id
      FROM AUTH_U01_roles
      WHERE role_code = 'EMPLOYEE'
      LIMIT 1;

      IF v_employee_role_id IS NULL THEN
        INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
        VALUES ('Employee', 'EMPLOYEE', 'Employee portal role', TRUE);
        SET v_employee_role_id = LAST_INSERT_ID();
      END IF;

      SELECT employee_id INTO v_employee_id
      FROM EMP_T01_employees
      WHERE candidate_id = v_candidate_id
         OR deployment_id = p_deployment_id
      ORDER BY employee_id ASC
      LIMIT 1;

      IF v_employee_id IS NOT NULL THEN
        UPDATE EMP_T01_employees
        SET employee_code = COALESCE(NULLIF(TRIM(v_employee_code), ''), COALESCE(NULLIF(TRIM(v_candidate_code), ''), employee_code)),
            employee_name = COALESCE(NULLIF(TRIM(v_employee_name), ''), employee_name),
            employee_contact_number = COALESCE(v_contact, employee_contact_number),
            address1 = COALESCE(v_address1, address1),
            address2 = COALESCE(v_address2, address2),
            pin_code = COALESCE(v_pin_code, pin_code),
            industry = COALESCE(v_industry, industry),
            work_location = COALESCE(v_work_location, work_location),
            employment_status = COALESCE(NULLIF(p_employment_status, ''), employment_status, 'Active'),
            date_of_joining = COALESCE(p_date_of_joining, date_of_joining, CURRENT_DATE),
            date_of_confirmation = COALESCE(p_date_of_confirmation, date_of_confirmation, CURRENT_DATE),
            candidate_id = v_candidate_id,
            deployment_id = p_deployment_id,
            partner_id = v_partner_id,
            shift_timing = p_shift_timing
        WHERE employee_id = v_employee_id;

        UPDATE REC_T01_candidates
        SET status = 'Employee',
            user_id = COALESCE(user_id, v_user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = v_candidate_id;

        IF v_user_id IS NOT NULL THEN
          UPDATE AUTH_U04_users
          SET role_id = v_employee_role_id
          WHERE user_id = v_user_id;
        END IF;

        UPDATE DEP_T01_deployments
        SET current_status = 'Employee', updated_by = p_user_id
        WHERE deployment_id = p_deployment_id;

        INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
        VALUES (p_deployment_id, 'Employee', 'Converted to employee', p_user_id);

        SELECT v_employee_id AS employee_id;
      ELSE
        IF v_employee_code IS NULL OR TRIM(v_employee_code) = '' THEN
          SET v_employee_code = COALESCE(NULLIF(TRIM(v_candidate_code), ''), CONCAT('EMP', LPAD(v_candidate_id, 6, '0')));
        ELSE
          SET v_employee_code = UPPER(REPLACE(TRIM(v_employee_code), ' ', ''));
        END IF;

        INSERT INTO EMP_T01_employees (
          employee_code, employee_name, employee_contact_number,
          address1, address2, pin_code, industry, work_location,
          employment_status, date_of_joining, date_of_confirmation,
          candidate_id, deployment_id, partner_id, shift_timing
        ) VALUES (
          v_employee_code, v_employee_name, v_contact,
          v_address1, v_address2, v_pin_code, v_industry, v_work_location,
          COALESCE(NULLIF(p_employment_status, ''), 'Active'), COALESCE(p_date_of_joining, CURRENT_DATE), COALESCE(p_date_of_confirmation, CURRENT_DATE),
          v_candidate_id, p_deployment_id, v_partner_id, p_shift_timing
        );
        SET v_employee_id = LAST_INSERT_ID();

        UPDATE REC_T01_candidates
        SET status = 'Employee',
            user_id = COALESCE(user_id, v_user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE candidate_id = v_candidate_id;

        IF v_user_id IS NOT NULL THEN
          UPDATE AUTH_U04_users
          SET role_id = v_employee_role_id
          WHERE user_id = v_user_id;
        END IF;

        UPDATE DEP_T01_deployments
        SET current_status = 'Employee', updated_by = p_user_id
        WHERE deployment_id = p_deployment_id;

        INSERT INTO DEP_T02_deployment_history (deployment_id, status, remarks, changed_by)
        VALUES (p_deployment_id, 'Employee', 'Converted to employee', p_user_id);

        SELECT v_employee_id AS employee_id;
      END IF;
    END;

  ELSEIF p_action = 'DISABLE' THEN
    UPDATE EMP_T01_employees
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE employee_id = p_employee_id
      AND deleted_at IS NULL;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_employees: invalid action';
  END IF;
END$$
DELIMITER ;
