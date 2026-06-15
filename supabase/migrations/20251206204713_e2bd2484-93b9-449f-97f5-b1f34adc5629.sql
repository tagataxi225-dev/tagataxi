-- Drop existing restrictive policies on rental_bookings
DROP POLICY IF EXISTS "Users can view their own rental bookings" ON rental_bookings;
DROP POLICY IF EXISTS "Users can create rental bookings" ON rental_bookings;
DROP POLICY IF EXISTS "Users can update their own rental bookings" ON rental_bookings;

-- Create new SELECT policy: clients can see their bookings, partners can see bookings on their vehicles
CREATE POLICY "Users and partners can view rental bookings"
ON rental_bookings
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM rental_vehicles rv
    JOIN partenaires p ON rv.partner_id = p.id
    WHERE rv.id = rental_bookings.vehicle_id
    AND p.user_id = auth.uid()
  )
);

-- Create INSERT policy: only authenticated users can create bookings
CREATE POLICY "Users can create rental bookings"
ON rental_bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy: clients can update their bookings, partners can update bookings on their vehicles
CREATE POLICY "Users and partners can update rental bookings"
ON rental_bookings
FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM rental_vehicles rv
    JOIN partenaires p ON rv.partner_id = p.id
    WHERE rv.id = rental_bookings.vehicle_id
    AND p.user_id = auth.uid()
  )
);

-- Create DELETE policy: only booking owner can delete
CREATE POLICY "Users can delete their own rental bookings"
ON rental_bookings
FOR DELETE
USING (auth.uid() = user_id);