-- Phase 1: Fix delivery tracking with proper UUIDs and pricing system
-- Create delivery_pricing_config for dynamic pricing management

CREATE TABLE IF NOT EXISTS public.delivery_pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL, -- 'flash', 'flex', 'maxicharge'
  base_price NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  price_per_km NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  minimum_fare NUMERIC(10,2) NOT NULL DEFAULT 3000.00,
  maximum_fare NUMERIC(10,2) DEFAULT NULL,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  UNIQUE(service_type, city, is_active)
);

-- Insert default pricing for each service type
INSERT INTO public.delivery_pricing_config (service_type, base_price, price_per_km, minimum_fare, city) VALUES 
('flash', 5000.00, 500.00, 3000.00, 'Kinshasa'),
('flex', 7000.00, 600.00, 4000.00, 'Kinshasa'),
('maxicharge', 12000.00, 800.00, 8000.00, 'Kinshasa'),
('flash', 6000.00, 600.00, 3500.00, 'Lubumbashi'),
('flex', 8000.00, 700.00, 4500.00, 'Lubumbashi'),
('maxicharge', 15000.00, 1000.00, 10000.00, 'Lubumbashi');

-- Create delivery_status_history for complete tracking
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  changed_by UUID REFERENCES auth.users,
  location_coordinates JSONB,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_pricing_config_active ON public.delivery_pricing_config(service_type, city, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_order ON public.delivery_status_history(delivery_order_id, changed_at);

-- Function to calculate dynamic delivery price
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  p_service_type TEXT,
  p_distance_km NUMERIC,
  p_city TEXT DEFAULT 'Kinshasa'
) RETURNS JSONB AS $$
DECLARE
  config_record RECORD;
  calculated_price NUMERIC;
  result JSONB;
BEGIN
  -- Get pricing configuration
  SELECT * INTO config_record 
  FROM public.delivery_pricing_config 
  WHERE service_type = p_service_type 
    AND city = p_city 
    AND is_active = true 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Fallback to default pricing
    config_record.base_price := CASE p_service_type
      WHEN 'flash' THEN 5000
      WHEN 'flex' THEN 7000
      WHEN 'maxicharge' THEN 12000
      ELSE 5000
    END;
    config_record.price_per_km := 500;
    config_record.minimum_fare := 3000;
    config_record.surge_multiplier := 1.0;
  END IF;
  
  -- Calculate price: base + (distance * price_per_km) * surge
  calculated_price := (config_record.base_price + (p_distance_km * config_record.price_per_km)) * COALESCE(config_record.surge_multiplier, 1.0);
  
  -- Apply minimum fare
  calculated_price := GREATEST(calculated_price, config_record.minimum_fare);
  
  -- Apply maximum fare if set
  IF config_record.maximum_fare IS NOT NULL THEN
    calculated_price := LEAST(calculated_price, config_record.maximum_fare);
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'base_price', config_record.base_price,
    'price_per_km', config_record.price_per_km,
    'distance_km', p_distance_km,
    'surge_multiplier', COALESCE(config_record.surge_multiplier, 1.0),
    'calculated_price', ROUND(calculated_price),
    'minimum_fare', config_record.minimum_fare,
    'maximum_fare', config_record.maximum_fare,
    'service_type', p_service_type,
    'city', p_city,
    'currency', COALESCE(config_record.currency, 'CDF')
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log delivery status changes
CREATE OR REPLACE FUNCTION public.log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.delivery_status_history (
      delivery_order_id,
      status,
      previous_status,
      changed_at,
      changed_by,
      location_coordinates,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      OLD.status,
      now(),
      auth.uid(),
      CASE 
        WHEN NEW.status = 'picked_up' OR NEW.status = 'in_transit' THEN 
          COALESCE(NEW.pickup_coordinates, NEW.delivery_coordinates)
        ELSE NULL
      END,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Commande confirmée'
        WHEN 'driver_assigned' THEN 'Chauffeur assigné'
        WHEN 'picked_up' THEN 'Colis récupéré'
        WHEN 'in_transit' THEN 'En cours de livraison'
        WHEN 'delivered' THEN 'Livraison terminée'
        WHEN 'cancelled' THEN 'Commande annulée'
        ELSE 'Changement de statut'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status change logging
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON public.delivery_orders;
CREATE TRIGGER delivery_status_change_trigger
  AFTER UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_delivery_status_change();

-- RLS policies for new tables
ALTER TABLE public.delivery_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;

-- Pricing config: Admins can manage, users can read active configs
CREATE POLICY "delivery_pricing_admin_manage" ON public.delivery_pricing_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "delivery_pricing_public_read" ON public.delivery_pricing_config
  FOR SELECT USING (is_active = true);

-- Status history: Users can view their own delivery history, admins can view all
CREATE POLICY "delivery_status_history_participants" ON public.delivery_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_orders 
      WHERE id = delivery_order_id 
        AND (user_id = auth.uid() OR driver_id = auth.uid())
    ) OR 
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Update timestamp trigger for pricing config
CREATE OR REPLACE FUNCTION public.update_delivery_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_pricing_config_timestamp
  BEFORE UPDATE ON public.delivery_pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_pricing_timestamp();