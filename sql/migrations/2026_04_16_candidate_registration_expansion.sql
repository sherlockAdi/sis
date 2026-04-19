-- Candidate registration expansion: profile fields, file paths, soft delete metadata

ALTER TABLE REC_T01_candidates
  ADD COLUMN father_name VARCHAR(150) DEFAULT NULL,
  ADD COLUMN address1 VARCHAR(255) DEFAULT NULL,
  ADD COLUMN address2 VARCHAR(255) DEFAULT NULL,
  ADD COLUMN pincode VARCHAR(20) DEFAULT NULL,
  ADD COLUMN dob DATE DEFAULT NULL,
  ADD COLUMN gender VARCHAR(20) DEFAULT NULL,
  ADD COLUMN skills TEXT DEFAULT NULL,
  ADD COLUMN education VARCHAR(150) DEFAULT NULL,
  ADD COLUMN experience VARCHAR(150) DEFAULT NULL,
  ADD COLUMN industry_type VARCHAR(150) DEFAULT NULL,
  ADD COLUMN resume_file_path TEXT DEFAULT NULL,
  ADD COLUMN passport_expiry_date DATE DEFAULT NULL,
  ADD COLUMN passport_file_path TEXT DEFAULT NULL,
  ADD COLUMN aadhar_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN aadhar_file_path TEXT DEFAULT NULL,
  ADD COLUMN pan_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN pan_file_path TEXT DEFAULT NULL,
  ADD COLUMN voter_id_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN voter_id_file_path TEXT DEFAULT NULL,
  ADD COLUMN profile_photo_file_path TEXT DEFAULT NULL,
  ADD COLUMN languages_known TEXT DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_candidate_profiles $$
CREATE PROCEDURE sp_rec_candidate_profiles(
  IN p_action VARCHAR(30),
  IN p_candidate_id INT,
  IN p_father_name VARCHAR(150),
  IN p_address1 VARCHAR(255),
  IN p_address2 VARCHAR(255),
  IN p_pincode VARCHAR(20),
  IN p_dob DATE,
  IN p_gender VARCHAR(20),
  IN p_skills TEXT,
  IN p_education VARCHAR(150),
  IN p_experience VARCHAR(150),
  IN p_industry_type VARCHAR(150),
  IN p_resume_file_path TEXT,
  IN p_passport_expiry_date DATE,
  IN p_passport_file_path TEXT,
  IN p_aadhar_number VARCHAR(50),
  IN p_aadhar_file_path TEXT,
  IN p_pan_number VARCHAR(50),
  IN p_pan_file_path TEXT,
  IN p_voter_id_number VARCHAR(50),
  IN p_voter_id_file_path TEXT,
  IN p_profile_photo_file_path TEXT,
  IN p_languages_known TEXT
)
BEGIN
  IF p_action = 'UPSERT' THEN
    UPDATE REC_T01_candidates
    SET
      father_name = COALESCE(p_father_name, father_name),
      address1 = COALESCE(p_address1, address1),
      address2 = COALESCE(p_address2, address2),
      pincode = COALESCE(p_pincode, pincode),
      dob = COALESCE(p_dob, dob),
      gender = COALESCE(p_gender, gender),
      skills = COALESCE(p_skills, skills),
      education = COALESCE(p_education, education),
      experience = COALESCE(p_experience, experience),
      industry_type = COALESCE(p_industry_type, industry_type),
      resume_file_path = COALESCE(p_resume_file_path, resume_file_path),
      passport_expiry_date = COALESCE(p_passport_expiry_date, passport_expiry_date),
      passport_file_path = COALESCE(p_passport_file_path, passport_file_path),
      aadhar_number = COALESCE(p_aadhar_number, aadhar_number),
      aadhar_file_path = COALESCE(p_aadhar_file_path, aadhar_file_path),
      pan_number = COALESCE(p_pan_number, pan_number),
      pan_file_path = COALESCE(p_pan_file_path, pan_file_path),
      voter_id_number = COALESCE(p_voter_id_number, voter_id_number),
      voter_id_file_path = COALESCE(p_voter_id_file_path, voter_id_file_path),
      profile_photo_file_path = COALESCE(p_profile_photo_file_path, profile_photo_file_path),
      languages_known = COALESCE(p_languages_known, languages_known),
      updated_at = CURRENT_TIMESTAMP
    WHERE candidate_id = p_candidate_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_candidate_profiles: invalid action';
  END IF;
END $$

DELIMITER ;
