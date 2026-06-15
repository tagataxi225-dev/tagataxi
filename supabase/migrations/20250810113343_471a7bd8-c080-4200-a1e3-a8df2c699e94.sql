-- Add missing moderation columns to rental_vehicles table
ALTER TABLE public.rental_vehicles 
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderator_id UUID REFERENCES auth.users(id);

-- Create index for better performance on moderation queries
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_moderation 
ON public.rental_vehicles(moderation_status, moderated_at);

-- Create index for moderator queries
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_moderator 
ON public.rental_vehicles(moderator_id) WHERE moderator_id IS NOT NULL;