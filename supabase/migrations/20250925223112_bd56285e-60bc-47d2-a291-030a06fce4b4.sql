-- Phase 1: Correction sécurité critique (version corrigée)

-- 1. Supprimer les vues SECURITY DEFINER dangereuses  
DROP VIEW IF EXISTS public.partner_earnings_view CASCADE;
DROP VIEW IF EXISTS public.driver_commission_view CASCADE;
DROP VIEW IF EXISTS public.rental_stats_view CASCADE;

-- 2. Correction fonctions sans search_path sécurisé
CREATE OR REPLACE FUNCTION public.get_partner_by_code(driver_code text)
RETURNS TABLE(
  partner_id uuid,
  partner_name text,
  commission_rate numeric,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.company_name,
    p.commission_rate,
    p.is_active
  FROM public.partenaires p
  JOIN public.partner_driver_assignments pda ON p.id = pda.partner_id
  JOIN public.driver_codes dc ON pda.driver_id = dc.driver_id
  WHERE dc.code = driver_code
    AND dc.is_active = true
    AND pda.is_active = true
    AND p.is_active = true;
END;
$$;

-- 3. Fonction sécurisée pour les earnings partenaires
CREATE OR REPLACE FUNCTION public.get_partner_earnings_secure(partner_user_id uuid, date_range text DEFAULT '30d')
RETURNS TABLE(
  total_bookings bigint,
  total_revenue numeric,
  total_commission numeric,
  driver_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_record RECORD;
  date_filter timestamp with time zone;
BEGIN
  -- Vérifier les permissions
  IF auth.uid() != partner_user_id AND NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Cannot view other partner earnings';
  END IF;

  -- Obtenir les infos partenaire
  SELECT id INTO partner_record
  FROM public.partenaires 
  WHERE user_id = partner_user_id AND is_active = true;
  
  IF partner_record IS NULL THEN
    RAISE EXCEPTION 'Partner not found or inactive';
  END IF;

  -- Calculer date de filtre
  CASE date_range
    WHEN '7d' THEN date_filter := now() - interval '7 days';
    WHEN '30d' THEN date_filter := now() - interval '30 days';
    ELSE date_filter := '1900-01-01'::timestamp with time zone;
  END CASE;

  RETURN QUERY
  SELECT 
    COUNT(tb.id)::bigint as total_bookings,
    COALESCE(SUM(tb.actual_price), 0) as total_revenue,
    COALESCE(SUM(tb.actual_price * (pda.commission_rate / 100)), 0) as total_commission,
    COUNT(DISTINCT pda.driver_id)::bigint as driver_count
  FROM public.transport_bookings tb
  JOIN public.partner_driver_assignments pda ON tb.driver_id = pda.driver_id
  WHERE pda.partner_id = partner_record.id
    AND pda.is_active = true
    AND tb.created_at >= date_filter
    AND tb.status = 'completed';
END;
$$;

-- 4. Table configuration commission globale
CREATE TABLE IF NOT EXISTS public.commission_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL, -- 'transport', 'delivery', 'rental'
  partner_commission_rate numeric NOT NULL DEFAULT 15.00,
  platform_commission_rate numeric NOT NULL DEFAULT 5.00,
  driver_commission_rate numeric NOT NULL DEFAULT 80.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  
  CONSTRAINT valid_service_type CHECK (service_type IN ('transport', 'delivery', 'rental')),
  CONSTRAINT valid_total_commission CHECK (
    partner_commission_rate + platform_commission_rate + driver_commission_rate = 100
  )
);

-- Enable RLS
ALTER TABLE public.commission_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission config admin only"
ON public.commission_configuration
FOR ALL
USING (is_current_user_admin());

-- Insérer configuration par défaut
INSERT INTO public.commission_configuration (service_type, partner_commission_rate, platform_commission_rate, driver_commission_rate)
VALUES 
  ('transport', 15.00, 5.00, 80.00),
  ('delivery', 12.00, 8.00, 80.00),
  ('rental', 20.00, 5.00, 75.00)
ON CONFLICT DO NOTHING;

-- 5. Amélioration système codes chauffeurs
CREATE TABLE IF NOT EXISTS public.driver_codes_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  partner_id uuid REFERENCES public.partenaires(id),
  
  -- Métadonnées du code
  code_type text NOT NULL DEFAULT 'recruitment', -- recruitment, temporary, permanent
  usage_limit integer DEFAULT 1,
  usage_count integer DEFAULT 0,
  
  -- Validité
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  
  -- Audit
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  
  CONSTRAINT valid_code_format CHECK (length(code) >= 6 AND length(code) <= 12),
  CONSTRAINT valid_code_type CHECK (code_type IN ('recruitment', 'temporary', 'permanent')),
  CONSTRAINT valid_usage CHECK (usage_count <= COALESCE(usage_limit, 999999))
);

-- Enable RLS
ALTER TABLE public.driver_codes_enhanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver codes self access"
ON public.driver_codes_enhanced
FOR ALL
USING (auth.uid() = driver_id OR auth.uid() IN (
  SELECT user_id FROM public.partenaires WHERE id = partner_id
) OR is_current_user_admin());

-- 6. Fonction génération code sécurisée
CREATE OR REPLACE FUNCTION public.generate_driver_code_secure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer code alphanumérique 8 caractères
    new_code := upper(
      substr(md5(random()::text), 1, 4) || 
      substr(md5(random()::text), 1, 4)
    );
    
    -- Vérifier unicité
    SELECT EXISTS(
      SELECT 1 FROM public.driver_codes_enhanced WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;