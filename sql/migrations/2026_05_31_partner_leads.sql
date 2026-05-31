CREATE TABLE IF NOT EXISTS LDS_T01_partner_leads (
  lead_id INT NOT NULL AUTO_INCREMENT,
  lead_code VARCHAR(30) NULL UNIQUE,
  lead_type ENUM('EMPLOYER', 'ASSOCIATE', 'UNDECIDED') NOT NULL DEFAULT 'UNDECIDED',
  organisation_name VARCHAR(180) NULL,
  contact_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(180) NULL,
  country_id INT NULL,
  state_id INT NULL,
  city_id INT NULL,
  address TEXT NULL,
  source VARCHAR(80) NULL,
  status ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  notes TEXT NULL,
  converted_to_type ENUM('EMPLOYER', 'ASSOCIATE') NULL,
  converted_partner_id INT NULL,
  converted_associate_partner_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (lead_id),
  INDEX idx_leads_type_status (lead_type, status),
  INDEX idx_leads_contact (phone, email),
  CONSTRAINT fk_leads_country FOREIGN KEY (country_id) REFERENCES LOC_M01_countries(country_id),
  CONSTRAINT fk_leads_state FOREIGN KEY (state_id) REFERENCES LOC_M02_states(state_id),
  CONSTRAINT fk_leads_city FOREIGN KEY (city_id) REFERENCES LOC_M03_cities(city_id),
  CONSTRAINT fk_leads_partner FOREIGN KEY (converted_partner_id) REFERENCES PART_T01_partners(partner_id),
  CONSTRAINT fk_leads_associate_partner FOREIGN KEY (converted_associate_partner_id) REFERENCES ASSOC_T01_associate_partners(associate_partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE LDS_T01_partner_leads
SET lead_code = CONCAT('LEAD', LPAD(lead_id, 6, '0'))
WHERE lead_code IS NULL;

SET @m_partners := (SELECT menu_id FROM AUTH_U02_menus WHERE menu_code = 'ADM_PARTNERS' LIMIT 1);

INSERT INTO AUTH_U02_menus (menu_name, menu_code, parent_menu_id, menu_path, icon, menu_order, status)
VALUES ('Lead Panel', 'ADM_PART_LEADS', @m_partners, '/leads', 'people', 84, TRUE)
ON DUPLICATE KEY UPDATE
  menu_name = VALUES(menu_name),
  parent_menu_id = VALUES(parent_menu_id),
  menu_path = VALUES(menu_path),
  icon = VALUES(icon),
  menu_order = VALUES(menu_order),
  status = VALUES(status);

INSERT INTO AUTH_U03_role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete)
SELECT r.role_id, m.menu_id, TRUE, TRUE, TRUE, TRUE
FROM AUTH_U01_roles r
JOIN AUTH_U02_menus m ON m.menu_code = 'ADM_PART_LEADS'
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN')
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_add = VALUES(can_add),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete);
