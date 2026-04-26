-- Ticket system schema.
-- Keep all ticket-related SQL in sql/Tickets/.

CREATE TABLE IF NOT EXISTS TCK_M01_ticket_types (
  ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_type_code VARCHAR(50) NOT NULL UNIQUE,
  ticket_type_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TCK_M02_ticket_statuses (
  ticket_status_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_status_code VARCHAR(50) NOT NULL UNIQUE,
  ticket_status_name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TCK_T01_tickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  ticket_type_id INT NOT NULL,
  ticket_status_id INT NOT NULL,
  raised_by_user_id INT NOT NULL,
  raised_by_role_code VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  related_job_id INT DEFAULT NULL,
  related_deployment_id INT DEFAULT NULL,
  related_candidate_id INT DEFAULT NULL,
  related_employee_id INT DEFAULT NULL,
  priority VARCHAR(30) DEFAULT 'Normal',
  visibility_scope VARCHAR(30) NOT NULL DEFAULT 'ADMIN_ONLY',
  assigned_to_user_id INT DEFAULT NULL,
  assigned_to_role_code VARCHAR(50) DEFAULT NULL,
  resolved_by_user_id INT DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  reopened_at TIMESTAMP NULL DEFAULT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_type_id) REFERENCES TCK_M01_ticket_types(ticket_type_id),
  FOREIGN KEY (ticket_status_id) REFERENCES TCK_M02_ticket_statuses(ticket_status_id)
);

CREATE TABLE IF NOT EXISTS TCK_T02_ticket_comments (
  ticket_comment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES TCK_T01_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES AUTH_U04_users(user_id)
);

CREATE TABLE IF NOT EXISTS TCK_T03_ticket_attachments (
  ticket_attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  uploaded_by_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES TCK_T01_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES AUTH_U04_users(user_id)
);

CREATE TABLE IF NOT EXISTS TCK_T04_ticket_access_rules (
  ticket_access_rule_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_type_id INT NOT NULL,
  role_code VARCHAR(50) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_assign TINYINT(1) NOT NULL DEFAULT 0,
  can_resolve TINYINT(1) NOT NULL DEFAULT 0,
  can_escalate TINYINT(1) NOT NULL DEFAULT 0,
  can_close TINYINT(1) NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ticket_access_rule (ticket_type_id, role_code),
  FOREIGN KEY (ticket_type_id) REFERENCES TCK_M01_ticket_types(ticket_type_id)
);

INSERT INTO TCK_M01_ticket_types (ticket_type_code, ticket_type_name, description, status)
VALUES
  ('JOB_RELATED', 'Job Related', 'Tickets linked to a job_id', 1),
  ('SYSTEM_ISSUE', 'System Issue', 'No job_id; platform or login issues', 1),
  ('FUNCTIONALITY_ISSUE', 'Functionality Issue', 'Feature-related tickets', 1),
  ('EMPLOYEE_ISSUE', 'Employee Issue', 'Attendance, salary, or employee support tickets', 1),
  ('CANDIDATE_ISSUE', 'Candidate Issue', 'Candidate support and profile issues', 1)
ON DUPLICATE KEY UPDATE
  ticket_type_name = VALUES(ticket_type_name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO TCK_M02_ticket_statuses (ticket_status_code, ticket_status_name, sort_order, status)
VALUES
  ('OPEN', 'Open', 10, 1),
  ('IN_PROGRESS', 'In Progress', 20, 1),
  ('ESCALATED', 'Escalated', 30, 1),
  ('RESOLVED', 'Resolved', 40, 1),
  ('CLOSED', 'Closed', 50, 1),
  ('REOPENED', 'Reopened', 60, 1)
ON DUPLICATE KEY UPDATE
  ticket_status_name = VALUES(ticket_status_name),
  sort_order = VALUES(sort_order),
  status = VALUES(status);

INSERT INTO TCK_T04_ticket_access_rules
  (ticket_type_id, role_code, can_view, can_create, can_assign, can_resolve, can_escalate, can_close, status)
SELECT t.ticket_type_id, r.role_code, r.can_view, r.can_create, r.can_assign, r.can_resolve, r.can_escalate, r.can_close, 1
FROM TCK_M01_ticket_types t
CROSS JOIN (
  SELECT 'ADMIN' AS role_code, 1 AS can_view, 1 AS can_create, 1 AS can_assign, 1 AS can_resolve, 1 AS can_escalate, 1 AS can_close
  UNION ALL SELECT 'SOURCING', 1, 1, 0, 0, 0, 0
  UNION ALL SELECT 'PARTNER', 1, 1, 0, 0, 0, 0
  UNION ALL SELECT 'EMPLOYER', 1, 1, 0, 0, 0, 0
  UNION ALL SELECT 'EMPLOYEE', 1, 1, 0, 0, 0, 0
  UNION ALL SELECT 'CANDIDATE', 1, 1, 0, 0, 0, 0
) AS r
ON DUPLICATE KEY UPDATE
  can_view = VALUES(can_view),
  can_create = VALUES(can_create),
  can_assign = VALUES(can_assign),
  can_resolve = VALUES(can_resolve),
  can_escalate = VALUES(can_escalate),
  can_close = VALUES(can_close),
  status = VALUES(status);
