-- Add current_status to deployments (fix for visa details auto status update)
ALTER TABLE DEP_T01_deployments
  ADD COLUMN current_status VARCHAR(50) DEFAULT 'Ready' AFTER application_id;

UPDATE DEP_T01_deployments
SET current_status = COALESCE(current_status, 'Ready');
