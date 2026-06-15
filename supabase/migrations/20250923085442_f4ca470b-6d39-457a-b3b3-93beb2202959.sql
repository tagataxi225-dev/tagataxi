-- Process pending delivery orders with automatic driver assignment
DO $$
DECLARE
  pending_delivery RECORD;
  assignment_result JSONB;
BEGIN
  -- Loop through pending delivery orders with valid coordinates
  FOR pending_delivery IN 
    SELECT id, pickup_coordinates, delivery_type
    FROM delivery_orders 
    WHERE status = 'pending' 
      AND pickup_coordinates IS NOT NULL 
      AND delivery_coordinates IS NOT NULL
    ORDER BY created_at ASC
  LOOP
    -- Try to assign a driver using the existing function
    SELECT * INTO assignment_result 
    FROM find_nearby_drivers(
      (pending_delivery.pickup_coordinates->>'lat')::numeric,
      (pending_delivery.pickup_coordinates->>'lng')::numeric,
      'delivery',
      15 -- 15km radius for deliveries
    )
    LIMIT 1;
    
    -- If a driver is found, assign them
    IF assignment_result IS NOT NULL THEN
      -- Update delivery order status
      UPDATE delivery_orders 
      SET status = 'confirmed',
          confirmed_at = now(),
          updated_at = now()
      WHERE id = pending_delivery.id;
      
      -- Add status history
      INSERT INTO delivery_status_history (
        delivery_order_id,
        status,
        previous_status,
        notes,
        changed_at
      ) VALUES (
        pending_delivery.id,
        'confirmed',
        'pending',
        'Commande confirmée automatiquement - En attente d''assignation de livreur',
        now()
      );
      
      RAISE NOTICE 'Processed delivery order %', pending_delivery.id;
    ELSE
      RAISE NOTICE 'No driver available for delivery order %', pending_delivery.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Finished processing pending delivery orders';
END $$;