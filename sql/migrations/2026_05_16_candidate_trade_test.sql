-- Candidate trade test storage
-- One uploaded video file per candidate and multiple trade video links.

CREATE TABLE IF NOT EXISTS REC_T04_candidate_trade_tests (
    trade_test_id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    trade_video_file_path VARCHAR(255) DEFAULT NULL,
    trade_video_file_name VARCHAR(255) DEFAULT NULL,
    trade_video_file_size BIGINT DEFAULT NULL,
    trade_video_uploaded_at TIMESTAMP NULL DEFAULT NULL,
    trade_video_links_json JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_candidate_trade_test_candidate (candidate_id),
    CONSTRAINT fk_candidate_trade_test_candidate
        FOREIGN KEY (candidate_id) REFERENCES REC_T01_candidates(candidate_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

