-- Refresh stale Abidjan driver pings
UPDATE driver_locations 
SET last_ping = NOW(), updated_at = NOW()
WHERE driver_id IN ('24227e85-3696-4f80-9f37-c21a615196e2', '8a09bc90-d494-44c9-ace6-048c9ec018f1');