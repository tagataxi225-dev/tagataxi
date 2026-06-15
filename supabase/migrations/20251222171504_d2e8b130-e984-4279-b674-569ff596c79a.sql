-- Remove old check constraint and add updated one with 'paid' status
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;

ALTER TABLE withdrawal_requests ADD CONSTRAINT withdrawal_requests_status_check 
CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'processing', 'cancelled'));