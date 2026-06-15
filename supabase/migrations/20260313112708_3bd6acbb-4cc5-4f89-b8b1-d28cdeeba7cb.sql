
-- Drop and recreate get_vendor_average_rating with correct param name
DROP FUNCTION IF EXISTS get_vendor_average_rating(UUID);

CREATE FUNCTION get_vendor_average_rating(vendor_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(r.rating), 0)
  FROM (
    SELECT rating FROM marketplace_ratings WHERE seller_id = vendor_id
    UNION ALL
    SELECT pr.rating FROM product_ratings pr
      JOIN marketplace_products mp ON mp.id = pr.product_id
    WHERE mp.seller_id = vendor_id
  ) r;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Recalculate all existing vendor ratings
UPDATE vendor_profiles vp
SET average_rating = COALESCE(sub.avg_rating, 0)
FROM (
  SELECT seller_id, AVG(rating) as avg_rating
  FROM (
    SELECT seller_id, rating FROM marketplace_ratings
    UNION ALL
    SELECT mp.seller_id, pr.rating
    FROM product_ratings pr
    JOIN marketplace_products mp ON mp.id = pr.product_id
  ) combined
  GROUP BY seller_id
) sub
WHERE vp.user_id = sub.seller_id;
