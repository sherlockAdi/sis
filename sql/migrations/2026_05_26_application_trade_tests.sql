-- Application trade test records
-- Stores admin-uploaded trade test video and certificate for a specific application.

CREATE TABLE IF NOT EXISTS REC_T06_application_trade_tests (
    trade_test_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    partner_id INT NOT NULL,
    trade_test_required TINYINT(1) NOT NULL DEFAULT 0,
    trade_video_file_path TEXT DEFAULT NULL,
    trade_video_file_name VARCHAR(255) DEFAULT NULL,
    trade_video_file_size BIGINT DEFAULT NULL,
    trade_video_uploaded_at TIMESTAMP NULL DEFAULT NULL,
    certificate_file_path TEXT DEFAULT NULL,
    certificate_file_name VARCHAR(255) DEFAULT NULL,
    certificate_file_size BIGINT DEFAULT NULL,
    certificate_uploaded_at TIMESTAMP NULL DEFAULT NULL,
    review_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    remarks VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES REC_T02_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES REC_T01_candidates(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES JOB_T01_jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES PART_T01_partners(partner_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES AUTH_U04_users(user_id),
    FOREIGN KEY (updated_by) REFERENCES AUTH_U04_users(user_id),
    INDEX idx_trade_test_partner_status (partner_id, review_status),
    INDEX idx_trade_test_job (job_id),
    INDEX idx_trade_test_candidate (candidate_id)
);



-- Application trade test records
-- Stores admin-uploaded trade test video and certificate for a specific application.

CREATE TABLE
IF NOT EXISTS REC_T06_application_trade_tests
(
    trade_test_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    partner_id INT NOT NULL,
    trade_test_required TINYINT
(1) NOT NULL DEFAULT 0,
    trade_video_file_path TEXT DEFAULT NULL,
    trade_video_file_name VARCHAR
(255) DEFAULT NULL,
    trade_video_file_size BIGINT DEFAULT NULL,
    trade_video_uploaded_at TIMESTAMP NULL DEFAULT NULL,
    certificate_file_path TEXT DEFAULT NULL,
    certificate_file_name VARCHAR
(255) DEFAULT NULL,
    certificate_file_size BIGINT DEFAULT NULL,
    certificate_uploaded_at TIMESTAMP NULL DEFAULT NULL,
    review_status VARCHAR
(20) NOT NULL DEFAULT 'Pending',
    remarks VARCHAR
(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY
(application_id) REFERENCES REC_T02_applications
(application_id) ON
DELETE CASCADE,
    FOREIGN KEY (candidate_id)
REFERENCES REC_T01_candidates
(candidate_id) ON
DELETE CASCADE,
    FOREIGN KEY (job_id)
REFERENCES JOB_T01_jobs
(job_id) ON
DELETE CASCADE,
    FOREIGN KEY (partner_id)
REFERENCES PART_T01_partners
(partner_id) ON
DELETE CASCADE,
    FOREIGN KEY (created_by)
REFERENCES AUTH_U04_users
(user_id),
    FOREIGN KEY
(updated_by) REFERENCES AUTH_U04_users
(user_id),
    INDEX idx_trade_test_partner_status
(partner_id, review_status),
    INDEX idx_trade_test_job
(job_id),
    INDEX idx_trade_test_candidate
(candidate_id)
);



