-- Créer marketplace_delivery_assignments sans trigger
CREATE TABLE IF NOT EXISTS public.marketplace_delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'assigned',
  delivery_fee NUMERIC NOT NULL DEFAULT 5000,
  pickup_coordinates JSONB,
  delivery_coordinates JSONB,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (assignment_status IN ('assigned', 'accepted', 'picked_up', 'delivered', 'cancelled'))
);

ALTER TABLE public.marketplace_delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_assignments_view"
  ON public.marketplace_delivery_assignments FOR SELECT
  USING (auth.uid() = driver_id OR is_current_user_admin());

CREATE POLICY "marketplace_assignments_update"
  ON public.marketplace_delivery_assignments FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE INDEX idx_mp_assign_order ON public.marketplace_delivery_assignments(order_id);
CREATE INDEX idx_mp_assign_driver ON public.marketplace_delivery_assignments(driver_id);