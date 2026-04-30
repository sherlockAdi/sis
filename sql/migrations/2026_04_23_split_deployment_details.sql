-- Split the deployment visa blob into offer, visa processing, and ticket booking tables
DROP TABLE IF EXISTS DEP_T03_visa_details;

CREATE TABLE IF NOT EXISTS DEP_T03_offer_details (
    offer_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    deployment_id INT NOT NULL UNIQUE,
    offer_date DATE DEFAULT NULL,
    offer_letter_file_path TEXT DEFAULT NULL,
    isaccepted TINYINT(1) DEFAULT 0,
    payment_received TINYINT(1) DEFAULT 0,
    remarks VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DEP_T04_visa_processing_details (
    visa_processing_id INT AUTO_INCREMENT PRIMARY KEY,
    deployment_id INT NOT NULL UNIQUE,
    visa_type_id INT DEFAULT NULL,
    visa_number VARCHAR(100) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    expiry_date DATE DEFAULT NULL,
    passport_number VARCHAR(100) DEFAULT NULL,
    passport_issue_date DATE DEFAULT NULL,
    passport_expiry_date DATE DEFAULT NULL,
    sponsor_id VARCHAR(100) DEFAULT NULL,
    sponsor_contact VARCHAR(100) DEFAULT NULL,
    passport_file_path TEXT DEFAULT NULL,
    visa_file_path TEXT DEFAULT NULL,
    payment_received TINYINT(1) DEFAULT 0,
    remarks VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DEP_T05_ticket_bookings (
    ticket_booking_id INT AUTO_INCREMENT PRIMARY KEY,
    deployment_id INT NOT NULL UNIQUE,
    ticket_number VARCHAR(100) DEFAULT NULL,
    booked_date DATE DEFAULT NULL,
    travel_date DATE DEFAULT NULL,
    ticket_file_path TEXT DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
