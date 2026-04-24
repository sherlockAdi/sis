-- Add Education and Skills master tables/procedures.

CREATE TABLE IF NOT EXISTS REC_M04_educations (
  education_id INT AUTO_INCREMENT PRIMARY KEY,
  education_name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS REC_M05_skills (
  skill_id INT AUTO_INCREMENT PRIMARY KEY,
  skill_name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP PROCEDURE IF EXISTS sp_rec_educations;
DELIMITER $$
CREATE PROCEDURE sp_rec_educations(
  IN p_action VARCHAR(10),
  IN p_education_id INT,
  IN p_education_name VARCHAR(150),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT education_id, education_name, description, status, created_at
      FROM REC_M04_educations
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY education_name ASC;
    WHEN 'GET' THEN
      SELECT education_id, education_name, description, status, created_at
      FROM REC_M04_educations
      WHERE education_id = p_education_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M04_educations (education_name, description, status)
      VALUES (p_education_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS education_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M04_educations
      SET education_name = COALESCE(p_education_name, education_name),
          description = COALESCE(p_description, description),
          status = COALESCE(p_status, status)
      WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M04_educations SET status = FALSE WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M04_educations WHERE education_id = p_education_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_educations: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_rec_skills $$
CREATE PROCEDURE sp_rec_skills(
  IN p_action VARCHAR(10),
  IN p_skill_id INT,
  IN p_skill_name VARCHAR(150),
  IN p_description VARCHAR(255),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT skill_id, skill_name, description, status, created_at
      FROM REC_M05_skills
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY skill_name ASC;
    WHEN 'GET' THEN
      SELECT skill_id, skill_name, description, status, created_at
      FROM REC_M05_skills
      WHERE skill_id = p_skill_id
      LIMIT 1;
    WHEN 'CREATE' THEN
      INSERT INTO REC_M05_skills (skill_name, description, status)
      VALUES (p_skill_name, p_description, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS skill_id;
    WHEN 'UPDATE' THEN
      UPDATE REC_M05_skills
      SET skill_name = COALESCE(p_skill_name, skill_name),
          description = COALESCE(p_description, description),
          status = COALESCE(p_status, status)
      WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DISABLE' THEN
      UPDATE REC_M05_skills SET status = FALSE WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    WHEN 'DELETE' THEN
      DELETE FROM REC_M05_skills WHERE skill_id = p_skill_id;
      SELECT ROW_COUNT() AS affected_rows;
    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_skills: invalid action';
  END CASE;
END $$
DELIMITER ;
