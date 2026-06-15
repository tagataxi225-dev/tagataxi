-- Add new status values for better order workflow management
-- First, let's update the marketplace_orders table to add more detailed timestamps

-- Add new timestamp columns for better tracking
ALTER TABLE public.marketplace_orders 
ADD COLUMN IF NOT EXISTS assigned_to_driver_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS picked_up_by_driver_at TIMESTAMP WITH TIME ZONE;

-- Update the existing status columns to be more flexible with new intermediate statuses
-- No need to change constraints as they will be handled by the application logic

-- Create a function to automatically update timestamps based on status changes
CREATE OR REPLACE FUNCTION public.update_marketplace_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set appropriate timestamps based on status changes
  CASE NEW.status
    WHEN 'confirmed' THEN
      IF OLD.status != 'confirmed' THEN
        NEW.confirmed_at = NOW();
      END IF;
    WHEN 'preparing' THEN
      IF OLD.status != 'preparing' THEN
        NEW.preparing_at = NOW();
      END IF;
    WHEN 'ready_for_pickup' THEN
      IF OLD.status != 'ready_for_pickup' THEN
        NEW.ready_for_pickup_at = NOW();
      END IF;
    WHEN 'assigned_to_driver' THEN
      IF OLD.status != 'assigned_to_driver' THEN
        NEW.assigned_to_driver_at = NOW();
      END IF;
    WHEN 'picked_up_by_driver' THEN
      IF OLD.status != 'picked_up_by_driver' THEN
        NEW.picked_up_by_driver_at = NOW();
      END IF;
    WHEN 'in_transit' THEN
      IF OLD.status != 'in_transit' THEN
        NEW.in_transit_at = NOW();
      END IF;
    WHEN 'delivered' THEN
      IF OLD.status != 'delivered' THEN
        NEW.delivered_at = NOW();
      END IF;
    WHEN 'completed' THEN
      IF OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS update_marketplace_order_timestamps_trigger ON public.marketplace_orders;
CREATE TRIGGER update_marketplace_order_timestamps_trigger
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_order_timestamps();