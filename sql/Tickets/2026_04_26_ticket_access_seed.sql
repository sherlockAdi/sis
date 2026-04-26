-- Seed/refresh ticket masters and access rules for the live database.

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
