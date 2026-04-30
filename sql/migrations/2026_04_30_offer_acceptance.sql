ALTER TABLE DEP_T03_offer_details
  ADD COLUMN IF NOT EXISTS isaccepted TINYINT(1) DEFAULT 0 AFTER offer_letter_file_path;

UPDATE DEP_T03_offer_details
SET isaccepted = COALESCE(isaccepted, 0)
WHERE isaccepted IS NULL;

DROP PROCEDURE IF EXISTS sp_dep_visa_details;

DELIMITER $$

CREATE PROCEDURE sp_dep_visa_details(
  IN p_action VARCHAR(30),
  IN p_visa_detail_id INT,
  IN p_deployment_id INT,
  IN p_offer_date DATE,
  IN p_offer_letter_file_path TEXT,
  IN p_isaccepted TINYINT(1),
  IN p_offer_payment_received TINYINT(1),
  IN p_offer_remarks VARCHAR(255),
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
  IN p_visa_payment_received TINYINT(1),
  IN p_visa_remarks VARCHAR(255),
  IN p_ticket_number VARCHAR(100),
  IN p_booked_date DATE,
  IN p_travel_date DATE,
  IN p_ticket_file_path TEXT,
  IN p_ticket_remarks VARCHAR(255),
  IN p_remarks VARCHAR(255),
  IN p_user_id INT
)
BEGIN
  IF p_action = 'GET_BY_DEPLOYMENT' THEN
    SELECT
      o.offer_detail_id,
      v.visa_processing_id,
      t.ticket_booking_id,
      p_deployment_id AS deployment_id,
      o.offer_date,
      o.offer_letter_file_path,
      o.isaccepted,
      o.payment_received AS offer_payment_received,
      o.remarks AS offer_remarks,
      v.visa_type_id,
      v.visa_number,
      v.issue_date,
      v.expiry_date,
      v.passport_number,
      v.passport_issue_date,
      v.passport_expiry_date,
      v.sponsor_id,
      v.sponsor_contact,
      v.passport_file_path,
      v.visa_file_path,
      v.payment_received AS visa_payment_received,
      v.remarks AS visa_remarks,
      t.ticket_number,
      t.booked_date,
      t.travel_date,
      t.ticket_file_path,
      t.remarks AS ticket_remarks,
      COALESCE(t.remarks, v.remarks, o.remarks, NULL) AS remarks,
      COALESCE(o.created_at, v.created_at, t.created_at, CURRENT_TIMESTAMP) AS created_at,
      COALESCE(o.updated_at, v.updated_at, t.updated_at, CURRENT_TIMESTAMP) AS updated_at
    FROM (SELECT p_deployment_id AS deployment_id) dep
    LEFT JOIN DEP_T03_offer_details o ON o.deployment_id = dep.deployment_id
    LEFT JOIN DEP_T04_visa_processing_details v ON v.deployment_id = dep.deployment_id
    LEFT JOIN DEP_T05_ticket_bookings t ON t.deployment_id = dep.deployment_id
    LIMIT 1;

  ELSEIF p_action = 'UPSERT' THEN
    BEGIN
      DECLARE v_offer_id INT DEFAULT NULL;
      DECLARE v_visa_id INT DEFAULT NULL;
      DECLARE v_ticket_id INT DEFAULT NULL;
      DECLARE v_result_id INT DEFAULT NULL;

      SELECT offer_detail_id INTO v_offer_id
      FROM DEP_T03_offer_details
      WHERE deployment_id = p_deployment_id
      LIMIT 1;

      IF p_isaccepted IS NOT NULL AND v_offer_id IS NULL AND p_offer_date IS NULL AND p_offer_letter_file_path IS NULL AND p_offer_payment_received IS NULL AND p_offer_remarks IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Offer details not found';
      END IF;

      IF p_offer_date IS NOT NULL OR p_offer_letter_file_path IS NOT NULL OR p_isaccepted IS NOT NULL OR p_offer_payment_received IS NOT NULL OR p_offer_remarks IS NOT NULL OR v_offer_id IS NOT NULL THEN
        IF v_offer_id IS NULL THEN
          INSERT INTO DEP_T03_offer_details (
            deployment_id, offer_date, offer_letter_file_path, isaccepted, payment_received, remarks, created_by, updated_by
          ) VALUES (
            p_deployment_id, p_offer_date, p_offer_letter_file_path, COALESCE(p_isaccepted, 0), COALESCE(p_offer_payment_received, 0), p_offer_remarks, p_user_id, p_user_id
          );
          SET v_offer_id = LAST_INSERT_ID();
        ELSE
          UPDATE DEP_T03_offer_details
          SET
            offer_date = COALESCE(p_offer_date, offer_date),
            offer_letter_file_path = COALESCE(NULLIF(p_offer_letter_file_path, ''), offer_letter_file_path),
            isaccepted = COALESCE(p_isaccepted, isaccepted),
            payment_received = COALESCE(p_offer_payment_received, payment_received),
            remarks = COALESCE(p_offer_remarks, remarks),
            updated_by = p_user_id
          WHERE offer_detail_id = v_offer_id;
        END IF;
      END IF;

      SELECT visa_processing_id INTO v_visa_id
      FROM DEP_T04_visa_processing_details
      WHERE deployment_id = p_deployment_id
      LIMIT 1;

      IF p_visa_type_id IS NOT NULL OR p_visa_number IS NOT NULL OR p_issue_date IS NOT NULL OR p_expiry_date IS NOT NULL OR p_passport_number IS NOT NULL OR p_passport_issue_date IS NOT NULL OR p_passport_expiry_date IS NOT NULL OR p_sponsor_id IS NOT NULL OR p_sponsor_contact IS NOT NULL OR p_passport_file_path IS NOT NULL OR p_visa_file_path IS NOT NULL OR p_visa_payment_received IS NOT NULL OR p_visa_remarks IS NOT NULL OR v_visa_id IS NOT NULL THEN
        IF v_visa_id IS NULL THEN
          INSERT INTO DEP_T04_visa_processing_details (
            deployment_id, visa_type_id, visa_number, issue_date, expiry_date,
            passport_number, passport_issue_date, passport_expiry_date,
            sponsor_id, sponsor_contact,
            passport_file_path, visa_file_path, payment_received, remarks,
            created_by, updated_by
          ) VALUES (
            p_deployment_id, p_visa_type_id, p_visa_number, p_issue_date, p_expiry_date,
            p_passport_number, p_passport_issue_date, p_passport_expiry_date,
            p_sponsor_id, p_sponsor_contact,
            p_passport_file_path, p_visa_file_path, COALESCE(p_visa_payment_received, 0), p_visa_remarks,
            p_user_id, p_user_id
          );
          SET v_visa_id = LAST_INSERT_ID();
        ELSE
          UPDATE DEP_T04_visa_processing_details
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
            passport_file_path = COALESCE(NULLIF(p_passport_file_path, ''), passport_file_path),
            visa_file_path = COALESCE(NULLIF(p_visa_file_path, ''), visa_file_path),
            payment_received = COALESCE(p_visa_payment_received, payment_received),
            remarks = COALESCE(p_visa_remarks, remarks),
            updated_by = p_user_id
          WHERE visa_processing_id = v_visa_id;
        END IF;
      END IF;

      SELECT ticket_booking_id INTO v_ticket_id
      FROM DEP_T05_ticket_bookings
      WHERE deployment_id = p_deployment_id
      LIMIT 1;

      IF p_ticket_number IS NOT NULL OR p_booked_date IS NOT NULL OR p_travel_date IS NOT NULL OR p_ticket_file_path IS NOT NULL OR p_ticket_remarks IS NOT NULL OR v_ticket_id IS NOT NULL THEN
        IF v_ticket_id IS NULL THEN
          INSERT INTO DEP_T05_ticket_bookings (
            deployment_id, ticket_number, booked_date, travel_date, ticket_file_path, remarks, created_by, updated_by
          ) VALUES (
            p_deployment_id, p_ticket_number, p_booked_date, p_travel_date, p_ticket_file_path, p_ticket_remarks, p_user_id, p_user_id
          );
          SET v_ticket_id = LAST_INSERT_ID();
        ELSE
          UPDATE DEP_T05_ticket_bookings
          SET
            ticket_number = COALESCE(p_ticket_number, ticket_number),
            booked_date = COALESCE(p_booked_date, booked_date),
            travel_date = COALESCE(p_travel_date, travel_date),
            ticket_file_path = COALESCE(NULLIF(p_ticket_file_path, ''), ticket_file_path),
            remarks = COALESCE(p_ticket_remarks, remarks),
            updated_by = p_user_id
          WHERE ticket_booking_id = v_ticket_id;
        END IF;
      END IF;

      SET v_result_id = COALESCE(v_offer_id, v_visa_id, v_ticket_id);
      SELECT v_result_id AS visa_detail_id;
    END;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_dep_visa_details: invalid action';
  END IF;
END $$

DELIMITER ;
