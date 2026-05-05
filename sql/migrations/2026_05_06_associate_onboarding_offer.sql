-- Associate partner onboarding offer listing
-- Adds a partner-scoped deployment view so the associate portal can show offer letters without affecting the candidate journey.

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_associate_onboarding_offers $$
CREATE PROCEDURE sp_rec_associate_onboarding_offers(
  IN p_action VARCHAR(30),
  IN p_deployment_id INT,
  IN p_associate_partner_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  IF p_action = 'LIST_BY_ASSOCIATE_PARTNER' THEN
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
      od.offer_date,
      od.offer_letter_file_path,
      od.isaccepted,
      od.payment_received AS offer_payment_received,
      od.remarks AS offer_remarks,
      d.created_at,
      d.updated_at
    FROM DEP_T01_deployments d
    JOIN REC_T02_applications a ON a.application_id = d.application_id
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    LEFT JOIN REC_M02_visa_types v ON v.visa_type_id = d.visa_type_id
    LEFT JOIN DEP_T03_offer_details od ON od.deployment_id = d.deployment_id
    WHERE c.associate_partner_id = p_associate_partner_id
      AND (NULLIF(p_status, '') IS NULL OR LOWER(COALESCE(d.current_status, '')) = LOWER(p_status))
    ORDER BY d.deployment_id DESC;

  ELSEIF p_action = 'GET' THEN
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
      od.offer_date,
      od.offer_letter_file_path,
      od.isaccepted,
      od.payment_received AS offer_payment_received,
      od.remarks AS offer_remarks,
      d.created_at,
      d.updated_at
    FROM DEP_T01_deployments d
    JOIN REC_T02_applications a ON a.application_id = d.application_id
    JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
    JOIN JOB_T01_jobs j ON j.job_id = a.job_id
    LEFT JOIN REC_M02_visa_types v ON v.visa_type_id = d.visa_type_id
    LEFT JOIN DEP_T03_offer_details od ON od.deployment_id = d.deployment_id
    WHERE d.deployment_id = p_deployment_id
      AND c.associate_partner_id = p_associate_partner_id
    LIMIT 1;

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'sp_rec_associate_onboarding_offers: invalid action';
  END IF;
END $$

DELIMITER ;
