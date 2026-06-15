-- Créer les tables de configuration pour les paramètres admin
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  setting_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_restart BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy pour que seuls les admins puissent gérer les paramètres
CREATE POLICY "admin_settings_admin_only" ON public.admin_settings
  FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Créer la table pour les notifications système
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'drivers', 'clients', 'partners'
  is_active BOOLEAN NOT NULL DEFAULT true,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur system_notifications
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Policy pour system_notifications
CREATE POLICY "system_notifications_admin_manage" ON public.system_notifications
  FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Créer la table pour les configurations de paiement
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_test_mode BOOLEAN NOT NULL DEFAULT true,
  supported_currencies TEXT[] NOT NULL DEFAULT ARRAY['CDF'],
  minimum_amount NUMERIC(10,2) NOT NULL DEFAULT 100,
  maximum_amount NUMERIC(10,2),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 2.5,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Policy pour payment_settings
CREATE POLICY "payment_settings_admin_only" ON public.payment_settings
  FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Insérer quelques paramètres par défaut
INSERT INTO public.admin_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', '"Kwenda Transport"', 'general', 'Nom de l''application'),
('app_version', '"2.0.0"', 'general', 'Version de l''application'),
('maintenance_mode', 'false', 'system', 'Mode maintenance actif'),
('max_concurrent_rides', '1000', 'system', 'Nombre maximum de courses simultanées'),
('default_currency', '"CDF"', 'financial', 'Devise par défaut'),
('support_email', '"support@kwenda-transport.com"', 'contact', 'Email de support'),
('support_phone', '"+243123456789"', 'contact', 'Téléphone de support'),
('google_maps_enabled', 'true', 'maps', 'Google Maps activé'),
('offline_mode_enabled', 'true', 'system', 'Mode hors ligne disponible'),
('auto_assign_drivers', 'true', 'dispatch', 'Attribution automatique des chauffeurs')
ON CONFLICT (setting_key) DO NOTHING;

-- Créer des triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_system_notifications_updated_at BEFORE UPDATE ON public.system_notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();