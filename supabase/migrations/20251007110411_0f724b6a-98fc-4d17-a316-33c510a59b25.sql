-- ============================================
-- ÉTAPE 1: MARKETPLACE - Tables de vérification vendeur
-- ============================================

-- Table des demandes de vérification vendeur
CREATE TABLE IF NOT EXISTS public.seller_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'under_review')),
  business_name TEXT,
  business_type TEXT,
  business_documents JSONB DEFAULT '[]'::jsonb,
  id_document_url TEXT,
  proof_of_address_url TEXT,
  rejection_reason TEXT,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_seller_verif_user ON public.seller_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verif_status ON public.seller_verification_requests(verification_status);

-- RLS pour seller_verification_requests
ALTER TABLE public.seller_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests"
  ON public.seller_verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification requests"
  ON public.seller_verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
  ON public.seller_verification_requests FOR ALL
  USING (public.is_current_user_admin());

-- Table des informations business vendeur
CREATE TABLE IF NOT EXISTS public.vendor_business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_registration_number TEXT,
  tax_identification_number TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  business_address TEXT,
  business_city TEXT DEFAULT 'Kinshasa',
  business_country TEXT DEFAULT 'RDC',
  additional_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour vendor_business_info
ALTER TABLE public.vendor_business_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business info"
  ON public.vendor_business_info FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all business info"
  ON public.vendor_business_info FOR SELECT
  USING (public.is_current_user_admin());

-- Trigger pour auto-sync seller_profiles après approbation
CREATE OR REPLACE FUNCTION public.sync_seller_on_verification_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  -- Ne rien faire si ce n'est pas une approbation
  IF NEW.verification_status != 'approved' OR OLD.verification_status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom du client
  SELECT display_name INTO v_client_name
  FROM public.clients
  WHERE user_id = NEW.user_id;
  
  -- Créer ou mettre à jour le profil vendeur
  INSERT INTO public.seller_profiles (
    user_id,
    display_name,
    seller_badge_level,
    verified_seller,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    COALESCE(NEW.business_name, v_client_name),
    'verified',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    verified_seller = true,
    seller_badge_level = 'verified',
    display_name = COALESCE(NEW.business_name, EXCLUDED.display_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_seller_on_verification ON public.seller_verification_requests;
CREATE TRIGGER trigger_sync_seller_on_verification
  AFTER INSERT OR UPDATE ON public.seller_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seller_on_verification_approval();

-- ============================================
-- ÉTAPE 2: TRANSPORT - Ajouter colonne completed_at
-- ============================================

-- Ajouter la colonne si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transport_bookings' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.transport_bookings 
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    
    -- Migrer les données existantes
    UPDATE public.transport_bookings 
    SET completed_at = updated_at 
    WHERE status = 'completed' AND completed_at IS NULL;
  END IF;
END $$;

-- Trigger pour auto-remplir completed_at
CREATE OR REPLACE FUNCTION public.auto_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le statut passe à 'completed', définir completed_at
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_completed_at ON public.transport_bookings;
CREATE TRIGGER trigger_auto_completed_at
  BEFORE UPDATE ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_completed_at();

-- ============================================
-- ÉTAPE 3: LIVRAISON - Améliorer validation
-- ============================================

-- Fonction de validation pour delivery_orders
CREATE OR REPLACE FUNCTION public.validate_delivery_order_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier les coordonnées pickup
  IF NEW.pickup_coordinates IS NULL OR 
     (NEW.pickup_coordinates->>'lat') IS NULL OR 
     (NEW.pickup_coordinates->>'lng') IS NULL THEN
    RAISE EXCEPTION 'Coordonnées de collecte manquantes ou invalides';
  END IF;
  
  -- Vérifier les coordonnées delivery
  IF NEW.delivery_coordinates IS NULL OR 
     (NEW.delivery_coordinates->>'lat') IS NULL OR 
     (NEW.delivery_coordinates->>'lng') IS NULL THEN
    RAISE EXCEPTION 'Coordonnées de livraison manquantes ou invalides';
  END IF;
  
  -- Vérifier les contacts
  IF NEW.sender_phone IS NULL OR NEW.sender_phone = '' THEN
    RAISE EXCEPTION 'Numéro de téléphone expéditeur requis';
  END IF;
  
  IF NEW.recipient_phone IS NULL OR NEW.recipient_phone = '' THEN
    RAISE EXCEPTION 'Numéro de téléphone destinataire requis';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_delivery_data ON public.delivery_orders;
CREATE TRIGGER trigger_validate_delivery_data
  BEFORE INSERT ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_delivery_order_data();

-- Logging pour debug
COMMENT ON FUNCTION public.validate_delivery_order_data IS 
'Valide les données de commande de livraison avant insertion pour éviter les erreurs de données manquantes';

COMMENT ON TABLE public.seller_verification_requests IS 
'Table des demandes de vérification vendeur pour le marketplace';

COMMENT ON TABLE public.vendor_business_info IS 
'Informations légales et bancaires des vendeurs vérifiés';