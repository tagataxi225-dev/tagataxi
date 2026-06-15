-- Création du système de tombola Kwenda

-- Table pour les types de prix de tombola
CREATE TABLE public.lottery_prize_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'cash', 'credit', 'service', 'product'
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les tirages de tombola
CREATE TABLE public.lottery_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  draw_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
  min_tickets_required INTEGER NOT NULL DEFAULT 1,
  max_winners INTEGER NOT NULL DEFAULT 1,
  total_participants INTEGER DEFAULT 0,
  total_tickets_used INTEGER DEFAULT 0,
  prize_pool JSONB DEFAULT '[]',
  draw_algorithm TEXT NOT NULL DEFAULT 'random',
  drawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les tickets de tombola des utilisateurs
CREATE TABLE public.lottery_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL, -- 'transport', 'delivery', 'marketplace_buy', 'marketplace_sell', 'referral', 'daily_login', 'challenge'
  source_id UUID, -- ID de la transaction/action qui a généré le ticket
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'used', 'expired'
  used_in_draw_id UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  multiplier NUMERIC DEFAULT 1.0, -- pour les événements spéciaux
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les participations aux tirages
CREATE TABLE public.lottery_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draw_id UUID NOT NULL,
  tickets_used INTEGER NOT NULL DEFAULT 1,
  ticket_ids JSONB NOT NULL DEFAULT '[]', -- Array des IDs des tickets utilisés
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_winner BOOLEAN DEFAULT false,
  prize_won JSONB, -- Détails du prix gagné
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des gains
CREATE TABLE public.lottery_wins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draw_id UUID NOT NULL,
  entry_id UUID NOT NULL,
  prize_type_id UUID,
  prize_details JSONB NOT NULL,
  prize_value NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'claimed', 'credited', 'expired'
  wallet_transaction_id UUID,
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activation du RLS sur toutes les tables
ALTER TABLE public.lottery_prize_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_wins ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour lottery_prize_types
CREATE POLICY "Everyone can view active prize types" 
ON public.lottery_prize_types 
FOR SELECT 
USING (is_active = true);

-- Politiques RLS pour lottery_draws
CREATE POLICY "Everyone can view lottery draws" 
ON public.lottery_draws 
FOR SELECT 
USING (true);

-- Politiques RLS pour lottery_tickets
CREATE POLICY "Users can view their own tickets" 
ON public.lottery_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create lottery tickets" 
ON public.lottery_tickets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update lottery tickets" 
ON public.lottery_tickets 
FOR UPDATE 
USING (true);

-- Politiques RLS pour lottery_entries
CREATE POLICY "Users can view their own entries" 
ON public.lottery_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
ON public.lottery_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour lottery_wins
CREATE POLICY "Users can view their own wins" 
ON public.lottery_wins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage lottery wins" 
ON public.lottery_wins 
FOR ALL 
USING (true);

-- Triggers pour les timestamps
CREATE TRIGGER update_lottery_prize_types_updated_at
BEFORE UPDATE ON public.lottery_prize_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lottery_draws_updated_at
BEFORE UPDATE ON public.lottery_draws
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_lottery_tickets_user_id ON public.lottery_tickets(user_id);
CREATE INDEX idx_lottery_tickets_status ON public.lottery_tickets(status);
CREATE INDEX idx_lottery_tickets_source ON public.lottery_tickets(source_type, source_id);
CREATE INDEX idx_lottery_entries_draw_id ON public.lottery_entries(draw_id);
CREATE INDEX idx_lottery_entries_user_id ON public.lottery_entries(user_id);
CREATE INDEX idx_lottery_wins_user_id ON public.lottery_wins(user_id);
CREATE INDEX idx_lottery_draws_status ON public.lottery_draws(status);
CREATE INDEX idx_lottery_draws_scheduled_date ON public.lottery_draws(scheduled_date);

-- Génération automatique des numéros de tickets
CREATE OR REPLACE FUNCTION public.generate_lottery_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  ticket_number TEXT;
  exists_check INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Générer un code de 10 caractères (format: KWND-XXXXXX)
    ticket_number := 'KWND-';
    FOR i IN 1..6 LOOP
      ticket_number := ticket_number || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Vérifier si le numéro existe déjà
    SELECT COUNT(*) INTO exists_check FROM public.lottery_tickets WHERE ticket_number = ticket_number;
    
    -- Si le numéro n'existe pas, sortir de la boucle
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN ticket_number;
END;
$function$;

-- Données initiales pour les types de prix
INSERT INTO public.lottery_prize_types (name, description, category, value, currency) VALUES
('Crédit Kwenda 1K', 'Crédit de 1,000 CDF sur votre portefeuille Kwenda Pay', 'credit', 1000, 'CDF'),
('Crédit Kwenda 5K', 'Crédit de 5,000 CDF sur votre portefeuille Kwenda Pay', 'credit', 5000, 'CDF'),
('Crédit Kwenda 10K', 'Crédit de 10,000 CDF sur votre portefeuille Kwenda Pay', 'credit', 10000, 'CDF'),
('Course Gratuite', 'Une course gratuite dans Kinshasa (valeur max 5,000 CDF)', 'service', 5000, 'CDF'),
('Livraison Gratuite', 'Une livraison gratuite dans Kinshasa (valeur max 3,000 CDF)', 'service', 3000, 'CDF'),
('Bonus Tickets', 'Pack de 10 tickets de tombola supplémentaires', 'service', 0, 'CDF'),
('Mega Prize 50K', 'Gros lot de 50,000 CDF !', 'cash', 50000, 'CDF'),
('Jackpot 100K', 'JACKPOT de 100,000 CDF !', 'cash', 100000, 'CDF');

-- Créer le premier tirage quotidien pour aujourd'hui
INSERT INTO public.lottery_draws (name, draw_type, scheduled_date, min_tickets_required, max_winners, prize_pool) VALUES
('Tirage Flash Quotidien', 'daily', NOW() + INTERVAL '1 hour', 1, 10, 
'[
  {"prize_type_id": null, "prize_name": "Crédit Kwenda 1K", "quantity": 5, "probability": 0.5},
  {"prize_type_id": null, "prize_name": "Crédit Kwenda 5K", "quantity": 3, "probability": 0.3},
  {"prize_type_id": null, "prize_name": "Course Gratuite", "quantity": 2, "probability": 0.2}
]'::jsonb);