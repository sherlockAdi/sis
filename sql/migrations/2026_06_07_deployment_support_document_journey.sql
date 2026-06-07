-- Add deployment support-document and journey fields used by the updated API/UI.

ALTER TABLE DEP_T04_visa_processing_details
  ADD COLUMN IF NOT EXISTS support_document_file_path TEXT DEFAULT NULL AFTER passport_file_path;

ALTER TABLE DEP_T05_ticket_bookings
  ADD COLUMN IF NOT EXISTS journey_from VARCHAR(255) DEFAULT NULL AFTER travel_date,
  ADD COLUMN IF NOT EXISTS journey_destination VARCHAR(255) DEFAULT NULL AFTER journey_from;
