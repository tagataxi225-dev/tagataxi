-- 1. Table des entreprises/employeurs
CREATE TABLE job_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des catégories d'emploi
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des offres d'emploi
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES job_companies(id),
  posted_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  employment_type VARCHAR(50) NOT NULL,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  location_city VARCHAR(100) NOT NULL,
  is_remote BOOLEAN DEFAULT FALSE,
  skills TEXT[],
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des candidatures
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- 5. Table des messages entre recruteur et candidat
CREATE TABLE job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des jobs sauvegardés
CREATE TABLE job_saved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Activer RLS
ALTER TABLE job_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_saved ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour job_companies
CREATE POLICY "Les entreprises sont visibles par tous"
  ON job_companies FOR SELECT
  USING (true);

CREATE POLICY "Les propriétaires peuvent créer leur entreprise"
  ON job_companies FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Les propriétaires peuvent modifier leur entreprise"
  ON job_companies FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- RLS Policies pour job_categories
CREATE POLICY "Les catégories sont visibles par tous"
  ON job_categories FOR SELECT
  USING (true);

-- RLS Policies pour jobs
CREATE POLICY "Les offres actives sont visibles par tous"
  ON jobs FOR SELECT
  USING (status = 'active' OR posted_by_user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent créer des offres"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = posted_by_user_id);

CREATE POLICY "Les créateurs peuvent modifier leurs offres"
  ON jobs FOR UPDATE
  USING (auth.uid() = posted_by_user_id);

CREATE POLICY "Les créateurs peuvent supprimer leurs offres"
  ON jobs FOR DELETE
  USING (auth.uid() = posted_by_user_id);

-- RLS Policies pour job_applications
CREATE POLICY "Les candidats voient leurs candidatures"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT posted_by_user_id FROM jobs WHERE id = job_id
  ));

CREATE POLICY "Les utilisateurs peuvent postuler"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les recruteurs peuvent modifier le statut"
  ON job_applications FOR UPDATE
  USING (auth.uid() IN (
    SELECT posted_by_user_id FROM jobs WHERE id = job_id
  ));

-- RLS Policies pour job_messages
CREATE POLICY "Les participants voient les messages"
  ON job_messages FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
  ON job_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Les destinataires peuvent marquer comme lu"
  ON job_messages FOR UPDATE
  USING (auth.uid() = to_user_id);

-- RLS Policies pour job_saved
CREATE POLICY "Les utilisateurs voient leurs jobs sauvegardés"
  ON job_saved FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent sauvegarder des jobs"
  ON job_saved FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer des jobs sauvegardés"
  ON job_saved FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_job_companies_updated_at BEFORE UPDATE ON job_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour incrémenter views_count
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET views_count = views_count + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_location ON jobs(location_city);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_job_applications_user ON job_applications(user_id);
CREATE INDEX idx_job_applications_job ON job_applications(job_id);
CREATE INDEX idx_job_saved_user ON job_saved(user_id);

-- Insérer des catégories par défaut
INSERT INTO job_categories (name, icon, sort_order) VALUES
  ('Transport & Logistique', 'Car', 1),
  ('Livraison', 'Truck', 2),
  ('Commerce & Vente', 'Store', 3),
  ('Restauration', 'UtensilsCrossed', 4),
  ('Tech & IT', 'Code', 5),
  ('Marketing', 'Megaphone', 6),
  ('Support Client', 'Headphones', 7),
  ('Administration', 'FileText', 8),
  ('Autre', 'Briefcase', 9);