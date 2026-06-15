-- Add columns for manual payment tracking by admin
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS admin_reference TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;