-- Table pour Questions/Réponses produits marketplace
CREATE TABLE IF NOT EXISTS product_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_qa_product ON product_qa(product_id);
CREATE INDEX IF NOT EXISTS idx_product_qa_user ON product_qa(user_id);
CREATE INDEX IF NOT EXISTS idx_product_qa_created ON product_qa(created_at DESC);

-- RLS Policies
ALTER TABLE product_qa ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les Q&A publiques
CREATE POLICY "Public can view questions"
  ON product_qa FOR SELECT
  USING (true);

-- Utilisateurs authentifiés peuvent poser des questions
CREATE POLICY "Authenticated users can ask questions"
  ON product_qa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Vendeurs peuvent répondre à leurs propres produits
CREATE POLICY "Sellers can answer their product questions"
  ON product_qa FOR UPDATE
  USING (
    answered_by IS NULL AND
    EXISTS (
      SELECT 1 FROM marketplace_products
      WHERE id = product_qa.product_id AND seller_id = auth.uid()
    )
  )
  WITH CHECK (answered_by = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_product_qa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_qa_updated_at
  BEFORE UPDATE ON product_qa
  FOR EACH ROW
  EXECUTE FUNCTION update_product_qa_updated_at();