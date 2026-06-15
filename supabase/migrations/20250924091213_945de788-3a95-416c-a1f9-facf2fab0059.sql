-- Tables pour le système de chat et évaluation taxi

-- Table pour les messages de chat taxi
CREATE TABLE IF NOT EXISTS public.transport_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'driver')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'quick_reply')),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les évaluations des chauffeurs
CREATE TABLE IF NOT EXISTS public.driver_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  user_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les signalements
CREATE TABLE IF NOT EXISTS public.booking_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  driver_id UUID,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ajouter une colonne 'rated' à transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS rated BOOLEAN DEFAULT false;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_transport_chat_messages_booking_id ON public.transport_chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_transport_chat_messages_sent_at ON public.transport_chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON public.driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_booking_id ON public.driver_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reports_booking_id ON public.booking_reports(booking_id);

-- RLS Policies

-- Chat messages : participants de la réservation peuvent voir/créer
ALTER TABLE public.transport_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transport_chat_participants_access" ON public.transport_chat_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.transport_bookings 
    WHERE id = transport_chat_messages.booking_id 
    AND (user_id = auth.uid() OR driver_id = auth.uid())
  )
);

-- Driver ratings : utilisateurs peuvent créer, chauffeurs peuvent voir les leurs
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_ratings_user_create" ON public.driver_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "driver_ratings_participants_view" ON public.driver_ratings
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = driver_id OR is_current_user_admin()
);

-- Booking reports : utilisateur peut créer, admins peuvent voir
ALTER TABLE public.booking_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_reports_user_create" ON public.booking_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "booking_reports_user_view_own" ON public.booking_reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "booking_reports_admin_access" ON public.booking_reports
FOR ALL USING (is_current_user_admin());

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_booking_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_reports_updated_at
  BEFORE UPDATE ON public.booking_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_reports_updated_at();