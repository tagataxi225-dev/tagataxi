-- Table des notifications pour les restaurants
CREATE TABLE IF NOT EXISTS public.food_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  order_id UUID,
  notification_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Index pour les performances
CREATE INDEX idx_food_notifications_restaurant_id ON public.food_notifications(restaurant_id);
CREATE INDEX idx_food_notifications_created_at ON public.food_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.food_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les restaurants peuvent lire leurs notifications
CREATE POLICY "Restaurants can read their notifications" 
ON public.food_notifications FOR SELECT 
USING (restaurant_id = auth.uid());

-- Policy: Les restaurants peuvent marquer leurs notifications comme lues
CREATE POLICY "Restaurants can update their notifications" 
ON public.food_notifications FOR UPDATE 
USING (restaurant_id = auth.uid());

-- Policy: Le système peut insérer des notifications
CREATE POLICY "System can insert notifications" 
ON public.food_notifications FOR INSERT 
WITH CHECK (true);