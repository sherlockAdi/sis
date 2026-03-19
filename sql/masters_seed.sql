-- Seed data for Masters

INSERT INTO REC_M01_interview_modes (mode_name) VALUES
('In Person'),
('Video Call'),
('Phone Call'),
('Online Assessment');

INSERT INTO REC_M02_visa_types (visa_type_name) VALUES
('Work Visa'),
('Visit Visa'),
('Student Visa'),
('Permanent Residency');

INSERT INTO JOB_M01_job_categories (category_name) VALUES
('Construction'),
('Hospitality'),
('IT'),
('Healthcare');

INSERT INTO JOB_M02_contract_durations (duration_name, months) VALUES
('6 Months',6),
('1 Year',12),
('2 Years',24);

INSERT INTO DOC_M01_document_types (document_name,is_required) VALUES
('Passport',1),
('Photo',1),
('Aadhar Card',0),
('Medical Certificate',1),
('Police Clearance',0);

INSERT INTO PAY_M01_payment_categories (category_name) VALUES
('Registration Fee'),
('Processing Fee'),
('Visa Fee'),
('Service Charge');

