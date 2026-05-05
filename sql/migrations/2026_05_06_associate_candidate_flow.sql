-- Associate Partner candidate flow
-- Adds associate-owned candidate linkage and a separate procedure set so the existing candidate journey stays unchanged.

ALTER TABLE REC_T01_candidates
  ADD COLUMN associate_partner_id INT DEFAULT NULL AFTER user_id;

ALTER TABLE REC_T01_candidates
  ADD CONSTRAINT fk_rec_candidates_associate_partner
    FOREIGN KEY (associate_partner_id) REFERENCES ASSOC_T01_associate_partners(associate_partner_id);

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_associate_candidates $$
CREATE PROCEDURE sp_rec_associate_candidates(
  IN p_action VARCHAR(30),
  IN p_candidate_id INT,
  IN p_associate_partner_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_passport_number VARCHAR(50),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_status VARCHAR(50),
  IN p_user_id INT,
  IN p_is_verified BOOLEAN
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
      c.father_name,
      c.address1,
      c.address2,
      c.pincode,
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
      c.status,
      c.is_verified,
      c.user_id,
      c.associate_partner_id,
      c.created_at,
      c.updated_at,
      c.deleted_at
    FROM REC_T01_candidates c
    LEFT JOIN LOC_M01_countries co ON co.country_id = c.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = c.state_id
    LEFT JOIN LOC_M03_cities ci ON ci.city_id = c.city_id
    WHERE c.deleted_at IS NULL
      AND c.associate_partner_id = p_associate_partner_id
    ORDER BY c.candidate_id DESC;

  ELSEIF p_action = 'GET' THEN
    SELECT
      c.*,
      co.country_name,
      st.state_name,
      ci.city_name
    FROM REC_T01_candidates c
    LEFT JOIN LOC_M01_countries co ON co.country_id = c.country_id
    LEFT JOIN LOC_M02_states st ON st.state_id = c.state_id
    LEFT JOIN LOC_M03_cities ci ON ci.city_id = c.city_id
    WHERE c.candidate_id = p_candidate_id
      AND c.associate_partner_id = p_associate_partner_id
    LIMIT 1;

  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO REC_T01_candidates (
      candidate_code, first_name, last_name, phone, email, passport_number,
      country_id, state_id, city_id, father_name, address1, address2, pincode, dob, gender,
      skills, education, experience, industry_type, resume_file_path, passport_expiry_date,
      passport_file_path, aadhar_number, aadhar_file_path, pan_number, pan_file_path,
      voter_id_number, voter_id_file_path, profile_photo_file_path, languages_known,
      status, is_verified, user_id, associate_partner_id
    ) VALUES (
      NULL, p_first_name, p_last_name, p_phone, p_email, p_passport_number,
      p_country_id, p_state_id, p_city_id, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL,
      COALESCE(NULLIF(p_status, ''), 'Associate Draft'),
      COALESCE(p_is_verified, TRUE),
      p_user_id,
      p_associate_partner_id
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
      status = COALESCE(NULLIF(p_status, ''), status),
      is_verified = COALESCE(p_is_verified, is_verified),
      user_id = COALESCE(p_user_id, user_id),
      associate_partner_id = COALESCE(p_associate_partner_id, associate_partner_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE candidate_id = p_candidate_id
      AND (p_associate_partner_id IS NULL OR associate_partner_id = p_associate_partner_id);
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'SET_USER' THEN
    UPDATE REC_T01_candidates
    SET
      user_id = p_user_id,
      email = COALESCE(NULLIF(p_email, ''), email),
      phone = COALESCE(NULLIF(p_phone, ''), phone),
      status = COALESCE(NULLIF(p_status, ''), status),
      updated_at = CURRENT_TIMESTAMP
    WHERE candidate_id = p_candidate_id
      AND (p_associate_partner_id IS NULL OR associate_partner_id = p_associate_partner_id);
    SELECT ROW_COUNT() AS affected_rows;

  ELSEIF p_action = 'DELETE' THEN
    UPDATE REC_T01_candidates
    SET
      status = 'Inactive',
      deleted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE candidate_id = p_candidate_id
      AND (p_associate_partner_id IS NULL OR associate_partner_id = p_associate_partner_id);
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_associate_candidates: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_rec_associate_applications $$
CREATE PROCEDURE sp_rec_associate_applications(
  IN p_action VARCHAR(30),
  IN p_application_id INT,
  IN p_associate_partner_id INT,
  IN p_candidate_id INT,
  IN p_job_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  IF p_action = 'LIST_BY_ASSOCIATE_PARTNER' THEN
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
      a.status,
      c.associate_partner_id
    FROM REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    WHERE c.associate_partner_id = p_associate_partner_id
      AND (p_candidate_id IS NULL OR a.candidate_id = p_candidate_id)
      AND (p_job_id IS NULL OR a.job_id = p_job_id)
      AND (NULLIF(p_status, '') IS NULL OR LOWER(COALESCE(a.status, '')) = LOWER(p_status))
    ORDER BY a.application_id DESC;

  ELSEIF p_action = 'GET' THEN
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
      a.status,
      c.associate_partner_id
    FROM REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    WHERE a.application_id = p_application_id
      AND c.associate_partner_id = p_associate_partner_id
    LIMIT 1;

  ELSEIF p_action = 'UPDATE_STATUS' THEN
    UPDATE REC_T02_applications a
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    SET a.status = COALESCE(NULLIF(p_status, ''), a.status)
    WHERE a.application_id = p_application_id
      AND c.associate_partner_id = p_associate_partner_id;
    SELECT ROW_COUNT() AS affected_rows;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_associate_applications: invalid action';
  END IF;
END $$

DELIMITER ;
