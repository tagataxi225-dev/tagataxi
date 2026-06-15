
CREATE TABLE public.product_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('marketplace', 'food')),
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, product_type)
);

CREATE INDEX idx_product_reactions_product ON product_reactions(product_id, product_type);
CREATE INDEX idx_product_reactions_user ON product_reactions(user_id);

ALTER TABLE product_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions"
  ON product_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read reaction counts"
  ON product_reactions FOR SELECT
  USING (true);
