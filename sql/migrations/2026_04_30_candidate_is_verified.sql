-- Add approval flag for candidates and backfill existing verified records

ALTER TABLE REC_T01_candidates
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER status;

UPDATE REC_T01_candidates
SET is_verified = CASE
  WHEN status IN ('Active', 'Approved', 'Verified') THEN TRUE
  ELSE FALSE
END;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_rec_candidate_verification $$
CREATE PROCEDURE sp_rec_candidate_verification(
  IN p_candidate_id INT,
  IN p_is_verified BOOLEAN
)
BEGIN
  UPDATE REC_T01_candidates
  SET
    is_verified = COALESCE(p_is_verified, is_verified),
    updated_at = CURRENT_TIMESTAMP
  WHERE candidate_id = p_candidate_id;

  SELECT ROW_COUNT() AS affected_rows;
END $$

DELIMITER ;
