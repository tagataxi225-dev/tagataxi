CREATE TABLE app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  version TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  release_notes TEXT,
  store_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app versions" ON app_versions FOR SELECT USING (true);