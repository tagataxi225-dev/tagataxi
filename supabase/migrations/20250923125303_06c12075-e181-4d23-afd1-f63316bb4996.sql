-- Créer les tables pour le système de sécurité et partage

-- Table pour les liens de partage de trajet
CREATE TABLE public.trip_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  trip_id UUID NOT NULL,
  encrypted_data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les audits d'accès géolocalisation étendus
CREATE TABLE public.geolocation_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'location_request', 'position_shared', 'trip_tracked', 'emergency_alert'
  resource_type TEXT NOT NULL, -- 'driver_location', 'trip_route', 'panic_button'
  resource_id UUID,
  location_data JSONB,
  encrypted_payload TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_score INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes d'urgence (panic button)
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL DEFAULT 'panic', -- 'panic', 'medical', 'security', 'accident'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'false_alarm'
  location JSONB NOT NULL, -- {lat, lng, accuracy, timestamp}
  trip_id UUID, -- Lien avec un trajet en cours si applicable
  emergency_contacts JSONB DEFAULT '[]', -- Liste des contacts d'urgence notifiés
  responder_id UUID REFERENCES auth.users(id), -- ID du secouriste/admin qui répond
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  auto_notifications_sent JSONB DEFAULT '{}', -- Journal des notifications automatiques
  priority_level INTEGER NOT NULL DEFAULT 5, -- 1=critique, 5=normal
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour la configuration de chiffrement
CREATE TABLE public.encryption_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_identifier TEXT NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  key_type TEXT NOT NULL, -- 'location', 'trip_data', 'emergency'
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_trip_share_links_share_id ON public.trip_share_links(share_id);
CREATE INDEX idx_trip_share_links_expires_at ON public.trip_share_links(expires_at) WHERE is_active = true;
CREATE INDEX idx_geolocation_audit_user_action ON public.geolocation_audit_trail(user_id, action_type, created_at);
CREATE INDEX idx_emergency_alerts_status ON public.emergency_alerts(status, created_at);
CREATE INDEX idx_emergency_alerts_user_active ON public.emergency_alerts(user_id, status) WHERE status = 'active';

-- RLS Policies

-- Trip share links - accès selon le créateur et lien public
ALTER TABLE public.trip_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own trip share links" 
ON public.trip_share_links 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own trip share links" 
ON public.trip_share_links 
FOR SELECT 
USING (auth.uid() = created_by OR is_active = true);

CREATE POLICY "Users can update their own trip share links" 
ON public.trip_share_links 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Geolocation audit trail - les utilisateurs voient leurs propres audits, admins voient tout
ALTER TABLE public.geolocation_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own geolocation audit" 
ON public.geolocation_audit_trail 
FOR SELECT 
USING (auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "System can insert audit records" 
ON public.geolocation_audit_trail 
FOR INSERT 
WITH CHECK (true); -- Permet insertion par les services système

-- Emergency alerts - utilisateur et admins
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own emergency alerts" 
ON public.emergency_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own emergency alerts" 
ON public.emergency_alerts 
FOR SELECT 
USING (auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "Users can update their own emergency alerts" 
ON public.emergency_alerts 
FOR UPDATE 
USING (auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "Admins can update any emergency alert" 
ON public.emergency_alerts 
FOR UPDATE 
USING (is_current_user_admin());

-- Encryption keys - accès admin uniquement
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage encryption keys" 
ON public.encryption_keys 
FOR ALL 
USING (is_current_user_admin());

-- Fonctions utilitaires

-- Fonction pour logger les accès géolocalisation
CREATE OR REPLACE FUNCTION public.log_geolocation_access(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_location_data JSONB DEFAULT NULL,
  p_encrypted_payload TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.geolocation_audit_trail (
    user_id, action_type, resource_type, resource_id,
    location_data, encrypted_payload, metadata
  ) VALUES (
    auth.uid(), p_action_type, p_resource_type, p_resource_id,
    p_location_data, p_encrypted_payload, p_metadata
  );
END;
$$;

-- Fonction pour calculer le score de risque
CREATE OR REPLACE FUNCTION public.calculate_risk_score(
  p_user_id UUID,
  p_action_type TEXT,
  p_time_window_hours INTEGER DEFAULT 24
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_actions INTEGER;
  risk_score INTEGER := 0;
BEGIN
  -- Compter les actions récentes
  SELECT COUNT(*) INTO recent_actions
  FROM public.geolocation_audit_trail
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > now() - (p_time_window_hours || ' hours')::interval;
  
  -- Calculer le score de risque basé sur la fréquence
  CASE
    WHEN recent_actions > 100 THEN risk_score := 10; -- Très élevé
    WHEN recent_actions > 50 THEN risk_score := 7;   -- Élevé
    WHEN recent_actions > 20 THEN risk_score := 5;   -- Moyen
    WHEN recent_actions > 10 THEN risk_score := 3;   -- Faible
    ELSE risk_score := 1; -- Très faible
  END CASE;
  
  RETURN risk_score;
END;
$$;

-- Fonction pour nettoyer les anciens audits
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 90
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Seuls les admins peuvent nettoyer
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  DELETE FROM public.geolocation_audit_trail
  WHERE created_at < now() - (p_retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_trip_share_links_updated_at
  BEFORE UPDATE ON public.trip_share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();