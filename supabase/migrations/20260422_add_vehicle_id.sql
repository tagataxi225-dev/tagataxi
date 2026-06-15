ALTER TABLE transport_bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES partner_taxi_vehicles(id);
ALTER TABLE partner_commission_tracking ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES partner_taxi_vehicles(id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_vehicle_id ON transport_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_vehicle_id ON partner_commission_tracking(vehicle_id);
