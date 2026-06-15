-- Add metadata column to push_notifications for bidding data
ALTER TABLE push_notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add transport_booking_id reference if not exists
ALTER TABLE push_notifications 
ADD COLUMN IF NOT EXISTS transport_booking_id UUID REFERENCES transport_bookings(id);

-- Add missing columns to ride_offers table
ALTER TABLE ride_offers 
ADD COLUMN IF NOT EXISTS estimated_arrival_time INTEGER,
ADD COLUMN IF NOT EXISTS driver_current_location JSONB;

-- Add index for faster queries on bidding notifications
CREATE INDEX IF NOT EXISTS idx_push_notifications_metadata ON push_notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_push_notifications_booking_id ON push_notifications(transport_booking_id);