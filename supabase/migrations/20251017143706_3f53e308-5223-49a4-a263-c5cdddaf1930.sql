-- =====================================================
-- ADMIN ACCESS POLICIES FOR FOOD SERVICE
-- =====================================================

-- 1. Admin full access to restaurant_profiles
CREATE POLICY "admin_full_access_restaurants"
ON restaurant_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- 2. Admin moderate food products
CREATE POLICY "admin_moderate_products"
ON food_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- 3. Admin view all food orders
CREATE POLICY "admin_view_all_orders"
ON food_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- 4. Admin manage restaurant subscriptions
CREATE POLICY "admin_manage_subscriptions"
ON restaurant_subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function: Get top restaurants by revenue
CREATE OR REPLACE FUNCTION get_top_restaurants(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  orders_count BIGINT,
  total_revenue NUMERIC,
  rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.restaurant_name as name,
    rp.city,
    COUNT(fo.id) as orders_count,
    COALESCE(SUM(fo.total_amount), 0) as total_revenue,
    COALESCE(rp.rating_average, 0) as rating
  FROM restaurant_profiles rp
  LEFT JOIN food_orders fo ON fo.restaurant_id = rp.id
    AND fo.created_at >= date_start
    AND fo.created_at <= date_end
    AND fo.payment_status = 'completed'
  WHERE rp.is_active = true
  GROUP BY rp.id, rp.restaurant_name, rp.city, rp.rating_average
  ORDER BY total_revenue DESC
  LIMIT limit_count;
END;
$$;

-- Function: Get top food products by orders
CREATE OR REPLACE FUNCTION get_top_food_products(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  restaurant_name TEXT,
  image_url TEXT,
  total_orders BIGINT,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.name,
    rp.restaurant_name,
    fp.main_image_url as image_url,
    COUNT(foi.id) as total_orders,
    COALESCE(SUM(foi.quantity * foi.unit_price), 0) as total_revenue
  FROM food_products fp
  JOIN restaurant_profiles rp ON rp.id = fp.restaurant_id
  LEFT JOIN food_order_items foi ON foi.product_id = fp.id
  LEFT JOIN food_orders fo ON fo.id = foi.order_id
    AND fo.created_at >= date_start
    AND fo.created_at <= date_end
    AND fo.payment_status = 'completed'
  WHERE fp.is_active = true
  GROUP BY fp.id, fp.name, rp.restaurant_name, fp.main_image_url
  ORDER BY total_orders DESC
  LIMIT limit_count;
END;
$$;