-- Sample data for Location Master
-- Safe to run once; re-running will create duplicates (no unique constraints in tables).

INSERT INTO LOC_M01_countries (country_name, country_code, iso_code) VALUES
('India','+91','IN'),
('United Arab Emirates','+971','AE'),
('Saudi Arabia','+966','SA'),
('Qatar','+974','QA'),
('Oman','+968','OM');

INSERT INTO LOC_M02_states (country_id, state_name) VALUES
(1,'Uttar Pradesh'),
(1,'Delhi'),
(1,'Maharashtra'),
(1,'Karnataka');

INSERT INTO LOC_M03_cities (state_id, city_name) VALUES
(1,'Lucknow'),
(1,'Kanpur'),
(1,'Varanasi'),
(2,'New Delhi'),
(3,'Mumbai');

