-- ================================
-- Location Master (LOC_M0x_*)
-- Tables + Procedure-only access layer
-- ================================

CREATE TABLE IF NOT EXISTS LOC_M01_countries (
  country_id INT AUTO_INCREMENT PRIMARY KEY,
  country_name VARCHAR(100) NOT NULL,
  country_code VARCHAR(10),
  iso_code VARCHAR(10),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LOC_M02_states (
  state_id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  state_code VARCHAR(20),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id)
);

CREATE TABLE IF NOT EXISTS LOC_M03_cities (
  city_id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id)
);

-- ================================
-- Procedures (single procedure per table; multi-action)
-- Actions: LIST, GET, CREATE, UPDATE, DISABLE, DELETE
-- ================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_loc_countries $$
CREATE PROCEDURE sp_loc_countries(
  IN p_action VARCHAR(10),
  IN p_country_id INT,
  IN p_country_name VARCHAR(100),
  IN p_country_code VARCHAR(10),
  IN p_iso_code VARCHAR(10),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT country_id, country_name, country_code, iso_code, status, created_at
      FROM LOC_M01_countries
      WHERE (COALESCE(p_include_inactive, FALSE) = TRUE) OR status = TRUE
      ORDER BY country_name ASC;

    WHEN 'GET' THEN
      SELECT country_id, country_name, country_code, iso_code, status, created_at
      FROM LOC_M01_countries
      WHERE country_id = p_country_id
      LIMIT 1;

    WHEN 'CREATE' THEN
      INSERT INTO LOC_M01_countries (country_name, country_code, iso_code, status)
      VALUES (p_country_name, p_country_code, p_iso_code, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS country_id;

    WHEN 'UPDATE' THEN
      UPDATE LOC_M01_countries
      SET
        country_name = COALESCE(p_country_name, country_name),
        country_code = COALESCE(p_country_code, country_code),
        iso_code = COALESCE(p_iso_code, iso_code),
        status = COALESCE(p_status, status)
      WHERE country_id = p_country_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DISABLE' THEN
      UPDATE LOC_M01_countries SET status = FALSE WHERE country_id = p_country_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DELETE' THEN
      DELETE FROM LOC_M01_countries WHERE country_id = p_country_id;
      SELECT ROW_COUNT() AS affected_rows;

    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_countries: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_loc_states $$
CREATE PROCEDURE sp_loc_states(
  IN p_action VARCHAR(10),
  IN p_state_id INT,
  IN p_country_id INT,
  IN p_state_name VARCHAR(100),
  IN p_state_code VARCHAR(20),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT s.state_id, s.country_id, c.country_name, s.state_name, s.state_code, s.status, s.created_at
      FROM LOC_M02_states s
      JOIN LOC_M01_countries c ON c.country_id = s.country_id
      WHERE (p_country_id IS NULL OR s.country_id = p_country_id)
        AND ((COALESCE(p_include_inactive, FALSE) = TRUE) OR s.status = TRUE)
      ORDER BY c.country_name ASC, s.state_name ASC;

    WHEN 'GET' THEN
      SELECT s.state_id, s.country_id, c.country_name, s.state_name, s.state_code, s.status, s.created_at
      FROM LOC_M02_states s
      JOIN LOC_M01_countries c ON c.country_id = s.country_id
      WHERE s.state_id = p_state_id
      LIMIT 1;

    WHEN 'CREATE' THEN
      SELECT COUNT(*) INTO v_exists FROM LOC_M01_countries WHERE country_id = p_country_id;
      IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_states: invalid country_id';
      END IF;

      INSERT INTO LOC_M02_states (country_id, state_name, state_code, status)
      VALUES (p_country_id, p_state_name, p_state_code, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS state_id;

    WHEN 'UPDATE' THEN
      IF p_country_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists FROM LOC_M01_countries WHERE country_id = p_country_id;
        IF v_exists = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_states: invalid country_id';
        END IF;
      END IF;

      UPDATE LOC_M02_states
      SET
        country_id = COALESCE(p_country_id, country_id),
        state_name = COALESCE(p_state_name, state_name),
        state_code = COALESCE(p_state_code, state_code),
        status = COALESCE(p_status, status)
      WHERE state_id = p_state_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DISABLE' THEN
      UPDATE LOC_M02_states SET status = FALSE WHERE state_id = p_state_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DELETE' THEN
      DELETE FROM LOC_M02_states WHERE state_id = p_state_id;
      SELECT ROW_COUNT() AS affected_rows;

    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_states: invalid action';
  END CASE;
END $$

DROP PROCEDURE IF EXISTS sp_loc_cities $$
CREATE PROCEDURE sp_loc_cities(
  IN p_action VARCHAR(10),
  IN p_city_id INT,
  IN p_state_id INT,
  IN p_city_name VARCHAR(100),
  IN p_status BOOLEAN,
  IN p_include_inactive BOOLEAN
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  CASE UPPER(TRIM(p_action))
    WHEN 'LIST' THEN
      SELECT ci.city_id, ci.state_id, s.state_name, s.country_id, c.country_name, ci.city_name, ci.status, ci.created_at
      FROM LOC_M03_cities ci
      JOIN LOC_M02_states s ON s.state_id = ci.state_id
      JOIN LOC_M01_countries c ON c.country_id = s.country_id
      WHERE (p_state_id IS NULL OR ci.state_id = p_state_id)
        AND ((COALESCE(p_include_inactive, FALSE) = TRUE) OR ci.status = TRUE)
      ORDER BY c.country_name ASC, s.state_name ASC, ci.city_name ASC;

    WHEN 'GET' THEN
      SELECT ci.city_id, ci.state_id, s.state_name, s.country_id, c.country_name, ci.city_name, ci.status, ci.created_at
      FROM LOC_M03_cities ci
      JOIN LOC_M02_states s ON s.state_id = ci.state_id
      JOIN LOC_M01_countries c ON c.country_id = s.country_id
      WHERE ci.city_id = p_city_id
      LIMIT 1;

    WHEN 'CREATE' THEN
      SELECT COUNT(*) INTO v_exists FROM LOC_M02_states WHERE state_id = p_state_id;
      IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_cities: invalid state_id';
      END IF;

      INSERT INTO LOC_M03_cities (state_id, city_name, status)
      VALUES (p_state_id, p_city_name, COALESCE(p_status, TRUE));
      SELECT LAST_INSERT_ID() AS city_id;

    WHEN 'UPDATE' THEN
      IF p_state_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists FROM LOC_M02_states WHERE state_id = p_state_id;
        IF v_exists = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_cities: invalid state_id';
        END IF;
      END IF;

      UPDATE LOC_M03_cities
      SET
        state_id = COALESCE(p_state_id, state_id),
        city_name = COALESCE(p_city_name, city_name),
        status = COALESCE(p_status, status)
      WHERE city_id = p_city_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DISABLE' THEN
      UPDATE LOC_M03_cities SET status = FALSE WHERE city_id = p_city_id;
      SELECT ROW_COUNT() AS affected_rows;

    WHEN 'DELETE' THEN
      DELETE FROM LOC_M03_cities WHERE city_id = p_city_id;
      SELECT ROW_COUNT() AS affected_rows;

    ELSE
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_loc_cities: invalid action';
  END CASE;
END $$

DELIMITER ;
