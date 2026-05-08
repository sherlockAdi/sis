-- Employer-scoped workforce management:
-- leave policies, yearly balances, holiday calendar, weekly off rules,
-- office geo-fences, attendance logs, and leave requests.

CREATE TABLE IF NOT EXISTS EMP_T02_leave_policies (
  leave_policy_id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  leave_code VARCHAR(30) NOT NULL,
  leave_name VARCHAR(120) NOT NULL,
  annual_limit_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  allow_half_day BOOLEAN NOT NULL DEFAULT TRUE,
  carry_forward_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  max_consecutive_days INT NOT NULL DEFAULT 0,
  min_notice_days INT NOT NULL DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_leave_policy (partner_id, leave_code),
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id)
);

CREATE TABLE IF NOT EXISTS EMP_T03_holiday_calendar (
  holiday_id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  holiday_name VARCHAR(150) NOT NULL,
  holiday_type ENUM('FIXED','YEARLY_VARIABLE','ONCE') NOT NULL DEFAULT 'FIXED',
  holiday_date DATE NULL,
  holiday_month INT NULL,
  holiday_day INT NULL,
  holiday_year INT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id)
);

CREATE TABLE IF NOT EXISTS EMP_T04_weekly_off_rules (
  weekly_off_rule_id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  country_id INT NULL,
  rule_name VARCHAR(150) NOT NULL,
  off_days_json JSON NOT NULL,
  effective_from DATE NULL,
  effective_to DATE NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id),
  FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id)
);

CREATE TABLE IF NOT EXISTS EMP_T05_office_locations (
  office_location_id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  location_name VARCHAR(150) NOT NULL,
  country_id INT NULL,
  state_id INT NULL,
  city_id INT NULL,
  address TEXT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  radius_meters INT NOT NULL DEFAULT 250,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id),
  FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
  FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
  FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id)
);

CREATE TABLE IF NOT EXISTS EMP_T06_leave_balances (
  leave_balance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  partner_id INT NOT NULL,
  leave_policy_id INT NOT NULL,
  leave_year INT NOT NULL,
  opening_balance DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  credited_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  used_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  balance_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_leave_balance (employee_id, leave_policy_id, leave_year),
  FOREIGN KEY (employee_id) REFERENCES EMP_T01_employees(employee_id),
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id),
  FOREIGN KEY (leave_policy_id) REFERENCES EMP_T02_leave_policies(leave_policy_id)
);

CREATE TABLE IF NOT EXISTS EMP_T07_leave_requests (
  leave_request_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  partner_id INT NOT NULL,
  leave_policy_id INT NOT NULL,
  leave_year INT NOT NULL,
  leave_from DATE NOT NULL,
  leave_to DATE NOT NULL,
  leave_mode ENUM('FULL','FIRST_HALF','SECOND_HALF') NOT NULL DEFAULT 'FULL',
  days_requested DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  reason TEXT NULL,
  document_path TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  approval_remarks TEXT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES EMP_T01_employees(employee_id),
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id),
  FOREIGN KEY (leave_policy_id) REFERENCES EMP_T02_leave_policies(leave_policy_id),
  FOREIGN KEY (approved_by) REFERENCES AUTH_U04_users(user_id)
);

CREATE TABLE IF NOT EXISTS EMP_T08_attendance_logs (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  partner_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  check_in_latitude DECIMAL(10,7) NULL,
  check_in_longitude DECIMAL(10,7) NULL,
  check_out_latitude DECIMAL(10,7) NULL,
  check_out_longitude DECIMAL(10,7) NULL,
  check_in_distance_meters INT NULL,
  check_out_distance_meters INT NULL,
  check_in_face_capture LONGTEXT NULL,
  check_out_face_capture LONGTEXT NULL,
  day_type ENUM('WORK_DAY','HOLIDAY','WEEKLY_OFF','LEAVE','EXCEPTION') NOT NULL DEFAULT 'WORK_DAY',
  status ENUM('OPEN','CLOSED','EXCEPTION') NOT NULL DEFAULT 'OPEN',
  remarks TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_attendance_day (employee_id, attendance_date),
  FOREIGN KEY (employee_id) REFERENCES EMP_T01_employees(employee_id),
  FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id)
);

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_emp_leave_policies $$
CREATE PROCEDURE sp_emp_leave_policies(
  IN p_action VARCHAR(30),
  IN p_leave_policy_id INT,
  IN p_partner_id INT,
  IN p_leave_code VARCHAR(30),
  IN p_leave_name VARCHAR(120),
  IN p_annual_limit_days DECIMAL(6,2),
  IN p_is_paid BOOLEAN,
  IN p_allow_half_day BOOLEAN,
  IN p_carry_forward_days DECIMAL(6,2),
  IN p_max_consecutive_days INT,
  IN p_min_notice_days INT,
  IN p_requires_approval BOOLEAN,
  IN p_status BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT *
    FROM EMP_T02_leave_policies
    WHERE (p_partner_id IS NULL OR partner_id = p_partner_id)
    ORDER BY leave_policy_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT *
    FROM EMP_T02_leave_policies
    WHERE leave_policy_id = p_leave_policy_id
    LIMIT 1;
  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO EMP_T02_leave_policies (
      partner_id, leave_code, leave_name, annual_limit_days, is_paid, allow_half_day,
      carry_forward_days, max_consecutive_days, min_notice_days, requires_approval, status
    ) VALUES (
      p_partner_id, p_leave_code, p_leave_name, COALESCE(p_annual_limit_days, 0), COALESCE(p_is_paid, TRUE), COALESCE(p_allow_half_day, TRUE),
      COALESCE(p_carry_forward_days, 0), COALESCE(p_max_consecutive_days, 0), COALESCE(p_min_notice_days, 0), COALESCE(p_requires_approval, TRUE), COALESCE(p_status, TRUE)
    );
    SELECT LAST_INSERT_ID() AS leave_policy_id;
  ELSEIF p_action = 'UPDATE' THEN
    UPDATE EMP_T02_leave_policies
    SET
      partner_id = COALESCE(p_partner_id, partner_id),
      leave_code = COALESCE(NULLIF(TRIM(p_leave_code), ''), leave_code),
      leave_name = COALESCE(NULLIF(TRIM(p_leave_name), ''), leave_name),
      annual_limit_days = COALESCE(p_annual_limit_days, annual_limit_days),
      is_paid = COALESCE(p_is_paid, is_paid),
      allow_half_day = COALESCE(p_allow_half_day, allow_half_day),
      carry_forward_days = COALESCE(p_carry_forward_days, carry_forward_days),
      max_consecutive_days = COALESCE(p_max_consecutive_days, max_consecutive_days),
      min_notice_days = COALESCE(p_min_notice_days, min_notice_days),
      requires_approval = COALESCE(p_requires_approval, requires_approval),
      status = COALESCE(p_status, status)
    WHERE leave_policy_id = p_leave_policy_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM EMP_T02_leave_policies WHERE leave_policy_id = p_leave_policy_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_leave_policies: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_emp_holiday_calendar $$
CREATE PROCEDURE sp_emp_holiday_calendar(
  IN p_action VARCHAR(30),
  IN p_holiday_id INT,
  IN p_partner_id INT,
  IN p_holiday_name VARCHAR(150),
  IN p_holiday_type VARCHAR(20),
  IN p_holiday_date DATE,
  IN p_holiday_month INT,
  IN p_holiday_day INT,
  IN p_holiday_year INT,
  IN p_is_paid BOOLEAN,
  IN p_status BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT *
    FROM EMP_T03_holiday_calendar
    WHERE (p_partner_id IS NULL OR partner_id = p_partner_id)
    ORDER BY
      COALESCE(holiday_date, STR_TO_DATE(CONCAT(IFNULL(holiday_year, YEAR(CURRENT_DATE)), '-', LPAD(IFNULL(holiday_month, 1), 2, '0'), '-', LPAD(IFNULL(holiday_day, 1), 2, '0')), '%Y-%m-%d')) DESC,
      holiday_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT * FROM EMP_T03_holiday_calendar WHERE holiday_id = p_holiday_id LIMIT 1;
  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO EMP_T03_holiday_calendar (
      partner_id, holiday_name, holiday_type, holiday_date, holiday_month, holiday_day, holiday_year, is_paid, status
    ) VALUES (
      p_partner_id, p_holiday_name, COALESCE(p_holiday_type, 'FIXED'), p_holiday_date, p_holiday_month, p_holiday_day, p_holiday_year, COALESCE(p_is_paid, TRUE), COALESCE(p_status, TRUE)
    );
    SELECT LAST_INSERT_ID() AS holiday_id;
  ELSEIF p_action = 'UPDATE' THEN
    UPDATE EMP_T03_holiday_calendar
    SET
      partner_id = COALESCE(p_partner_id, partner_id),
      holiday_name = COALESCE(NULLIF(TRIM(p_holiday_name), ''), holiday_name),
      holiday_type = COALESCE(NULLIF(TRIM(p_holiday_type), ''), holiday_type),
      holiday_date = COALESCE(p_holiday_date, holiday_date),
      holiday_month = COALESCE(p_holiday_month, holiday_month),
      holiday_day = COALESCE(p_holiday_day, holiday_day),
      holiday_year = COALESCE(p_holiday_year, holiday_year),
      is_paid = COALESCE(p_is_paid, is_paid),
      status = COALESCE(p_status, status)
    WHERE holiday_id = p_holiday_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM EMP_T03_holiday_calendar WHERE holiday_id = p_holiday_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_holiday_calendar: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_emp_weekly_off_rules $$
CREATE PROCEDURE sp_emp_weekly_off_rules(
  IN p_action VARCHAR(30),
  IN p_weekly_off_rule_id INT,
  IN p_partner_id INT,
  IN p_country_id INT,
  IN p_rule_name VARCHAR(150),
  IN p_off_days_json JSON,
  IN p_effective_from DATE,
  IN p_effective_to DATE,
  IN p_status BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT *
    FROM EMP_T04_weekly_off_rules
    WHERE (p_partner_id IS NULL OR partner_id = p_partner_id)
    ORDER BY weekly_off_rule_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT * FROM EMP_T04_weekly_off_rules WHERE weekly_off_rule_id = p_weekly_off_rule_id LIMIT 1;
  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO EMP_T04_weekly_off_rules (
      partner_id, country_id, rule_name, off_days_json, effective_from, effective_to, status
    ) VALUES (
      p_partner_id, p_country_id, p_rule_name, p_off_days_json, p_effective_from, p_effective_to, COALESCE(p_status, TRUE)
    );
    SELECT LAST_INSERT_ID() AS weekly_off_rule_id;
  ELSEIF p_action = 'UPDATE' THEN
    UPDATE EMP_T04_weekly_off_rules
    SET
      partner_id = COALESCE(p_partner_id, partner_id),
      country_id = COALESCE(p_country_id, country_id),
      rule_name = COALESCE(NULLIF(TRIM(p_rule_name), ''), rule_name),
      off_days_json = COALESCE(p_off_days_json, off_days_json),
      effective_from = COALESCE(p_effective_from, effective_from),
      effective_to = COALESCE(p_effective_to, effective_to),
      status = COALESCE(p_status, status)
    WHERE weekly_off_rule_id = p_weekly_off_rule_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM EMP_T04_weekly_off_rules WHERE weekly_off_rule_id = p_weekly_off_rule_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_weekly_off_rules: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_emp_office_locations $$
CREATE PROCEDURE sp_emp_office_locations(
  IN p_action VARCHAR(30),
  IN p_office_location_id INT,
  IN p_partner_id INT,
  IN p_location_name VARCHAR(150),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_address TEXT,
  IN p_latitude DECIMAL(10,7),
  IN p_longitude DECIMAL(10,7),
  IN p_radius_meters INT,
  IN p_status BOOLEAN
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT *
    FROM EMP_T05_office_locations
    WHERE (p_partner_id IS NULL OR partner_id = p_partner_id)
    ORDER BY office_location_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT * FROM EMP_T05_office_locations WHERE office_location_id = p_office_location_id LIMIT 1;
  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO EMP_T05_office_locations (
      partner_id, location_name, country_id, state_id, city_id, address, latitude, longitude, radius_meters, status
    ) VALUES (
      p_partner_id, p_location_name, p_country_id, p_state_id, p_city_id, p_address, p_latitude, p_longitude, COALESCE(p_radius_meters, 250), COALESCE(p_status, TRUE)
    );
    SELECT LAST_INSERT_ID() AS office_location_id;
  ELSEIF p_action = 'UPDATE' THEN
    UPDATE EMP_T05_office_locations
    SET
      partner_id = COALESCE(p_partner_id, partner_id),
      location_name = COALESCE(NULLIF(TRIM(p_location_name), ''), location_name),
      country_id = COALESCE(p_country_id, country_id),
      state_id = COALESCE(p_state_id, state_id),
      city_id = COALESCE(p_city_id, city_id),
      address = COALESCE(p_address, address),
      latitude = COALESCE(p_latitude, latitude),
      longitude = COALESCE(p_longitude, longitude),
      radius_meters = COALESCE(p_radius_meters, radius_meters),
      status = COALESCE(p_status, status)
    WHERE office_location_id = p_office_location_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM EMP_T05_office_locations WHERE office_location_id = p_office_location_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_office_locations: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_emp_leave_requests $$
CREATE PROCEDURE sp_emp_leave_requests(
  IN p_action VARCHAR(30),
  IN p_leave_request_id INT,
  IN p_employee_id INT,
  IN p_partner_id INT,
  IN p_leave_policy_id INT,
  IN p_leave_year INT,
  IN p_leave_from DATE,
  IN p_leave_to DATE,
  IN p_leave_mode VARCHAR(20),
  IN p_days_requested DECIMAL(6,2),
  IN p_reason TEXT,
  IN p_document_path TEXT,
  IN p_status VARCHAR(20),
  IN p_approval_remarks TEXT,
  IN p_approved_by INT,
  IN p_approved_at DATETIME
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT lr.*, e.employee_name, e.employee_code, lp.leave_name, lp.is_paid
    FROM EMP_T07_leave_requests lr
    JOIN EMP_T01_employees e ON e.employee_id = lr.employee_id
    JOIN EMP_T02_leave_policies lp ON lp.leave_policy_id = lr.leave_policy_id
    WHERE (p_partner_id IS NULL OR lr.partner_id = p_partner_id)
      AND (p_employee_id IS NULL OR lr.employee_id = p_employee_id)
      AND lr.deleted_at IS NULL
    ORDER BY lr.leave_request_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT lr.*, e.employee_name, e.employee_code, lp.leave_name, lp.is_paid
    FROM EMP_T07_leave_requests lr
    JOIN EMP_T01_employees e ON e.employee_id = lr.employee_id
    JOIN EMP_T02_leave_policies lp ON lp.leave_policy_id = lr.leave_policy_id
    WHERE lr.leave_request_id = p_leave_request_id
    LIMIT 1;
  ELSEIF p_action = 'CREATE' THEN
    INSERT INTO EMP_T07_leave_requests (
      employee_id, partner_id, leave_policy_id, leave_year, leave_from, leave_to, leave_mode,
      days_requested, reason, document_path, status
    ) VALUES (
      p_employee_id, p_partner_id, p_leave_policy_id, p_leave_year, p_leave_from, p_leave_to, COALESCE(p_leave_mode, 'FULL'),
      COALESCE(p_days_requested, 0), p_reason, p_document_path, COALESCE(p_status, 'PENDING')
    );
    SELECT LAST_INSERT_ID() AS leave_request_id;
  ELSEIF p_action = 'APPROVE' THEN
    UPDATE EMP_T07_leave_requests
    SET status = 'APPROVED', approval_remarks = p_approval_remarks, approved_by = p_approved_by, approved_at = COALESCE(p_approved_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
    WHERE leave_request_id = p_leave_request_id AND deleted_at IS NULL;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'REJECT' THEN
    UPDATE EMP_T07_leave_requests
    SET status = 'REJECTED', approval_remarks = p_approval_remarks, approved_by = p_approved_by, approved_at = COALESCE(p_approved_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
    WHERE leave_request_id = p_leave_request_id AND deleted_at IS NULL;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'CANCEL' THEN
    UPDATE EMP_T07_leave_requests
    SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
    WHERE leave_request_id = p_leave_request_id AND deleted_at IS NULL;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_leave_requests: invalid action';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_emp_attendance_logs $$
CREATE PROCEDURE sp_emp_attendance_logs(
  IN p_action VARCHAR(30),
  IN p_attendance_id INT,
  IN p_employee_id INT,
  IN p_partner_id INT,
  IN p_attendance_date DATE,
  IN p_check_in_at DATETIME,
  IN p_check_out_at DATETIME,
  IN p_check_in_latitude DECIMAL(10,7),
  IN p_check_in_longitude DECIMAL(10,7),
  IN p_check_out_latitude DECIMAL(10,7),
  IN p_check_out_longitude DECIMAL(10,7),
  IN p_check_in_distance_meters INT,
  IN p_check_out_distance_meters INT,
  IN p_check_in_face_capture LONGTEXT,
  IN p_check_out_face_capture LONGTEXT,
  IN p_day_type VARCHAR(20),
  IN p_status VARCHAR(20),
  IN p_remarks TEXT
)
BEGIN
  IF p_action = 'LIST' THEN
    SELECT a.*, e.employee_name, e.employee_code
    FROM EMP_T08_attendance_logs a
    JOIN EMP_T01_employees e ON e.employee_id = a.employee_id
    WHERE (p_partner_id IS NULL OR a.partner_id = p_partner_id)
      AND (p_employee_id IS NULL OR a.employee_id = p_employee_id)
    ORDER BY a.attendance_date DESC, a.attendance_id DESC;
  ELSEIF p_action = 'GET' THEN
    SELECT a.*, e.employee_name, e.employee_code
    FROM EMP_T08_attendance_logs a
    JOIN EMP_T01_employees e ON e.employee_id = a.employee_id
    WHERE a.attendance_id = p_attendance_id
    LIMIT 1;
  ELSEIF p_action = 'UPSERT_CHECK_IN' THEN
    INSERT INTO EMP_T08_attendance_logs (
      employee_id, partner_id, attendance_date, check_in_at, check_in_latitude, check_in_longitude, check_in_distance_meters, check_in_face_capture, day_type, status, remarks
    ) VALUES (
      p_employee_id, p_partner_id, p_attendance_date, p_check_in_at, p_check_in_latitude, p_check_in_longitude, p_check_in_distance_meters, p_check_in_face_capture, COALESCE(p_day_type, 'WORK_DAY'), COALESCE(p_status, 'OPEN'), p_remarks
    )
    ON DUPLICATE KEY UPDATE
      check_in_at = COALESCE(VALUES(check_in_at), check_in_at),
      check_in_latitude = COALESCE(VALUES(check_in_latitude), check_in_latitude),
      check_in_longitude = COALESCE(VALUES(check_in_longitude), check_in_longitude),
      check_in_distance_meters = COALESCE(VALUES(check_in_distance_meters), check_in_distance_meters),
      check_in_face_capture = COALESCE(VALUES(check_in_face_capture), check_in_face_capture),
      day_type = COALESCE(VALUES(day_type), day_type),
      status = COALESCE(VALUES(status), status),
      remarks = COALESCE(VALUES(remarks), remarks),
      updated_at = CURRENT_TIMESTAMP;
    SELECT ROW_COUNT() AS affected_rows;
  ELSEIF p_action = 'UPSERT_CHECK_OUT' THEN
    UPDATE EMP_T08_attendance_logs
    SET
      check_out_at = COALESCE(p_check_out_at, check_out_at),
      check_out_latitude = COALESCE(p_check_out_latitude, check_out_latitude),
      check_out_longitude = COALESCE(p_check_out_longitude, check_out_longitude),
      check_out_distance_meters = COALESCE(p_check_out_distance_meters, check_out_distance_meters),
      check_out_face_capture = COALESCE(p_check_out_face_capture, check_out_face_capture),
      status = COALESCE(p_status, status),
      remarks = COALESCE(p_remarks, remarks),
      updated_at = CURRENT_TIMESTAMP
    WHERE attendance_id = p_attendance_id;
    SELECT ROW_COUNT() AS affected_rows;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_emp_attendance_logs: invalid action';
  END IF;
END $$

DELIMITER ;
