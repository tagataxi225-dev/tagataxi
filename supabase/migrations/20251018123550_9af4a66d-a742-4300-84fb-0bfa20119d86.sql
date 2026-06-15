
-- ============================================================
-- MIGRATION SYSTÈME POS RESTAURANT + INVENTAIRE
-- ============================================================

-- 1. Table des sessions de caisse
CREATE TABLE IF NOT EXISTS public.restaurant_pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES auth.users(id) NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  opening_cash NUMERIC DEFAULT 0 NOT NULL,
  closing_cash NUMERIC,
  expected_cash NUMERIC,
  cash_difference NUMERIC,
  total_transactions INTEGER DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Table des transactions POS (ventes directes en caisse)
CREATE TABLE IF NOT EXISTS public.restaurant_pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.restaurant_pos_sessions(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  discount_reason TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'kwenda_pay')),
  payment_reference TEXT,
  served_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT
);

-- 3. Table d'inventaire des produits restaurant
CREATE TABLE IF NOT EXISTS public.restaurant_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.food_products(id) ON DELETE CASCADE NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  unit_cost NUMERIC DEFAULT 0,
  last_restocked_at TIMESTAMPTZ,
  last_restocked_by UUID REFERENCES auth.users(id),
  low_stock_alert BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(restaurant_id, product_id)
);

-- 4. Table des mouvements de stock
CREATE TABLE IF NOT EXISTS public.restaurant_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.restaurant_inventory(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.food_products(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste', 'sale')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Table des rapports quotidiens
CREATE TABLE IF NOT EXISTS public.restaurant_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  cash_revenue NUMERIC DEFAULT 0,
  card_revenue NUMERIC DEFAULT 0,
  mobile_money_revenue NUMERIC DEFAULT 0,
  wallet_revenue NUMERIC DEFAULT 0,
  refunds_amount NUMERIC DEFAULT 0,
  discounts_amount NUMERIC DEFAULT 0,
  top_selling_products JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(restaurant_id, report_date)
);

-- ============================================================
-- INDEXES POUR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pos_sessions_restaurant ON public.restaurant_pos_sessions(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_opened_at ON public.restaurant_pos_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session ON public.restaurant_pos_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_restaurant ON public.restaurant_pos_transactions(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_number ON public.restaurant_pos_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON public.restaurant_inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.restaurant_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.restaurant_inventory(restaurant_id) WHERE low_stock_alert = true;
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON public.restaurant_stock_movements(inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant ON public.restaurant_stock_movements(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_restaurant ON public.restaurant_daily_reports(restaurant_id, report_date DESC);

-- ============================================================
-- TRIGGER AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION update_pos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pos_sessions_updated_at
  BEFORE UPDATE ON public.restaurant_pos_sessions
  FOR EACH ROW EXECUTE FUNCTION update_pos_updated_at();

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.restaurant_inventory
  FOR EACH ROW EXECUTE FUNCTION update_pos_updated_at();

-- ============================================================
-- TRIGGER AUTO-GÉNÉRATION NUMÉRO TRANSACTION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_pos_transaction_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_transaction_number
  BEFORE INSERT ON public.restaurant_pos_transactions
  FOR EACH ROW EXECUTE FUNCTION generate_pos_transaction_number();

-- ============================================================
-- TRIGGER DÉCRÉMENTATION AUTO STOCK LORS VENTE POS
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_stock_on_pos_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_id_val UUID;
  quantity_val INTEGER;
  inventory_record RECORD;
BEGIN
  -- Parcourir tous les items de la transaction
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    product_id_val := (item->>'product_id')::UUID;
    quantity_val := (item->>'quantity')::INTEGER;
    
    -- Vérifier si l'inventaire existe
    SELECT * INTO inventory_record
    FROM public.restaurant_inventory
    WHERE restaurant_id = NEW.restaurant_id
      AND product_id = product_id_val;
    
    IF FOUND THEN
      -- Décrémenter le stock
      UPDATE public.restaurant_inventory
      SET 
        current_stock = current_stock - quantity_val,
        low_stock_alert = (current_stock - quantity_val) <= minimum_stock,
        updated_at = NOW()
      WHERE id = inventory_record.id;
      
      -- Logger le mouvement de stock
      INSERT INTO public.restaurant_stock_movements (
        inventory_id,
        restaurant_id,
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        reference_id,
        created_by
      ) VALUES (
        inventory_record.id,
        NEW.restaurant_id,
        product_id_val,
        'sale',
        -quantity_val,
        inventory_record.current_stock,
        inventory_record.current_stock - quantity_val,
        'pos_transaction',
        NEW.id,
        NEW.served_by
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_decrement_stock_pos
  AFTER INSERT ON public.restaurant_pos_transactions
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_pos_sale();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- POS Sessions
ALTER TABLE public.restaurant_pos_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners manage their pos sessions"
  ON public.restaurant_pos_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE id = restaurant_pos_sessions.restaurant_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all pos sessions"
  ON public.restaurant_pos_sessions
  FOR SELECT
  USING (is_current_user_admin());

-- POS Transactions
ALTER TABLE public.restaurant_pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners manage their transactions"
  ON public.restaurant_pos_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE id = restaurant_pos_transactions.restaurant_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all transactions"
  ON public.restaurant_pos_transactions
  FOR SELECT
  USING (is_current_user_admin());

-- Inventory
ALTER TABLE public.restaurant_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners manage their inventory"
  ON public.restaurant_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE id = restaurant_inventory.restaurant_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all inventory"
  ON public.restaurant_inventory
  FOR SELECT
  USING (is_current_user_admin());

-- Stock Movements
ALTER TABLE public.restaurant_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners view their stock movements"
  ON public.restaurant_stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE id = restaurant_stock_movements.restaurant_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all stock movements"
  ON public.restaurant_stock_movements
  FOR SELECT
  USING (is_current_user_admin());

-- Daily Reports
ALTER TABLE public.restaurant_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners view their reports"
  ON public.restaurant_daily_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE id = restaurant_daily_reports.restaurant_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all reports"
  ON public.restaurant_daily_reports
  FOR SELECT
  USING (is_current_user_admin());

-- ============================================================
-- LOG MIGRATION
-- ============================================================

INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'database_migration',
  'Système POS Restaurant avec inventaire complet déployé',
  jsonb_build_object(
    'migration_version', '2025-01-pos-system-complete',
    'tables_created', ARRAY[
      'restaurant_pos_sessions',
      'restaurant_pos_transactions', 
      'restaurant_inventory',
      'restaurant_stock_movements',
      'restaurant_daily_reports'
    ],
    'triggers_created', ARRAY[
      'auto_transaction_number',
      'auto_decrement_stock_pos',
      'pos_sessions_updated_at',
      'inventory_updated_at'
    ],
    'timestamp', NOW()
  )
);
