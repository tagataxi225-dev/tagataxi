-- Fix delivery_orders_delivery_type_check constraint to allow all delivery types
ALTER TABLE public.delivery_orders 
DROP CONSTRAINT IF EXISTS delivery_orders_delivery_type_check;

-- Add the updated constraint with all valid delivery types
ALTER TABLE public.delivery_orders 
ADD CONSTRAINT delivery_orders_delivery_type_check 
CHECK (delivery_type IN ('flash', 'flex', 'maxicharge', 'cargo'));