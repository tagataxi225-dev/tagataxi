-- Phase 1: Restructuration des rôles utilisateurs
-- Créer les tables spécialisées pour chaque type d'utilisateur

-- Table des rôles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les rôles de base
INSERT INTO public.roles (name, display_name, description) VALUES 
  ('simple_user_client', 'Client Simple', 'Utilisateur client standard'),
  ('chauffeur', 'Chauffeur', 'Chauffeur de véhicule'),
  ('admin', 'Administrateur', 'Administrateur du système'),
  ('partenaire', 'Partenaire', 'Partenaire commercial')
ON CONFLICT (name) DO NOTHING;

-- Table des clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_language TEXT DEFAULT 'fr',
  address TEXT,
  city TEXT DEFAULT 'Kinshasa',
  country TEXT DEFAULT 'RDC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email),
  UNIQUE(phone_number)
);

-- Table des chauffeurs
CREATE TABLE IF NOT EXISTS public.chauffeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL UNIQUE,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_color TEXT,
  insurance_number TEXT NOT NULL,
  insurance_expiry DATE NOT NULL,
  bank_account_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  service_areas TEXT[] DEFAULT ARRAY['Kinshasa'],
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active BOOLEAN DEFAULT false,
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email),
  UNIQUE(phone_number)
);

-- Table des admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  admin_level TEXT DEFAULT 'moderator' CHECK (admin_level IN ('super_admin', 'admin', 'moderator')),
  permissions TEXT[] DEFAULT ARRAY['basic_access'],
  department TEXT,
  employee_id TEXT UNIQUE,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email),
  UNIQUE(phone_number)
);

-- Table des partenaires
CREATE TABLE IF NOT EXISTS public.partenaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_registration_number TEXT,
  business_type TEXT NOT NULL,
  tax_number TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Kinshasa',
  country TEXT DEFAULT 'RDC',
  contact_person_name TEXT,
  contact_person_phone TEXT,
  bank_account_number TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email),
  UNIQUE(phone_number)
);

-- Fonction pour assurer l'unicité globale de l'email et du téléphone
CREATE OR REPLACE FUNCTION check_global_email_phone_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  email_count INTEGER := 0;
  phone_count INTEGER := 0;
BEGIN
  -- Vérifier l'unicité de l'email across toutes les tables
  SELECT COUNT(*) INTO email_count FROM (
    SELECT email FROM public.clients WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.chauffeurs WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.admins WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.partenaires WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS emails;

  -- Vérifier l'unicité du téléphone across toutes les tables
  SELECT COUNT(*) INTO phone_count FROM (
    SELECT phone_number FROM public.clients WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.chauffeurs WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.admins WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.partenaires WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS phones;

  IF email_count > 0 THEN
    RAISE EXCEPTION 'Email % déjà utilisé par un autre utilisateur', NEW.email;
  END IF;

  IF phone_count > 0 THEN
    RAISE EXCEPTION 'Numéro de téléphone % déjà utilisé par un autre utilisateur', NEW.phone_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour chaque table
CREATE TRIGGER check_clients_email_phone_uniqueness
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION check_global_email_phone_uniqueness();

CREATE TRIGGER check_chauffeurs_email_phone_uniqueness
  BEFORE INSERT OR UPDATE ON public.chauffeurs
  FOR EACH ROW EXECUTE FUNCTION check_global_email_phone_uniqueness();

CREATE TRIGGER check_admins_email_phone_uniqueness
  BEFORE INSERT OR UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION check_global_email_phone_uniqueness();

CREATE TRIGGER check_partenaires_email_phone_uniqueness
  BEFORE INSERT OR UPDATE ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION check_global_email_phone_uniqueness();

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

-- Policies pour la table roles (lecture publique)
CREATE POLICY "Tous peuvent voir les rôles actifs" ON public.roles
  FOR SELECT USING (is_active = true);

-- Policies pour la table clients
CREATE POLICY "Clients peuvent gérer leur propre profil" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent voir tous les clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policies pour la table chauffeurs
CREATE POLICY "Chauffeurs peuvent gérer leur propre profil" ON public.chauffeurs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Clients peuvent voir les chauffeurs vérifiés" ON public.chauffeurs
  FOR SELECT USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Admins peuvent voir tous les chauffeurs" ON public.chauffeurs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policies pour la table admins
CREATE POLICY "Admins peuvent gérer leur propre profil" ON public.admins
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Super admins peuvent voir tous les admins" ON public.admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND admin_level = 'super_admin' AND is_active = true
    )
  );

-- Policies pour la table partenaires
CREATE POLICY "Partenaires peuvent gérer leur propre profil" ON public.partenaires
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent voir tous les partenaires" ON public.partenaires
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Fonction pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT := NULL;
BEGIN
  -- Vérifier dans l'ordre de priorité: admin, partenaire, chauffeur, client
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'partenaire';
  ELSIF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'chauffeur';
  ELSIF EXISTS (SELECT 1 FROM public.clients WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'simple_user_client';
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chauffeurs_updated_at BEFORE UPDATE ON public.chauffeurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partenaires_updated_at BEFORE UPDATE ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();