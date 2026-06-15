
-- Tarifs livraison Abidjan (XOF) - adaptés au marché ivoirien
INSERT INTO pricing_rules (service_type, vehicle_class, city, base_price, price_per_km, price_per_minute, minimum_fare, surge_multiplier, waiting_fee_per_minute, free_waiting_time_minutes, max_waiting_time_minutes, currency, is_active)
VALUES
  ('delivery', 'flash', 'abidjan', 1500, 300, 0, 1500, 1.0, 0, 5, 30, 'XOF', true),
  ('delivery', 'flex', 'abidjan', 3000, 500, 0, 3000, 1.0, 0, 5, 30, 'XOF', true),
  ('delivery', 'maxicharge', 'abidjan', 5000, 800, 0, 5000, 1.0, 0, 5, 30, 'XOF', true),

-- Tarifs livraison Lubumbashi (CDF x1.2)
  ('delivery', 'flash', 'lubumbashi', 6000, 1200, 0, 6000, 1.0, 0, 5, 30, 'CDF', true),
  ('delivery', 'flex', 'lubumbashi', 66000, 3000, 0, 66000, 1.0, 0, 5, 30, 'CDF', true),
  ('delivery', 'maxicharge', 'lubumbashi', 120000, 6000, 0, 120000, 1.0, 0, 5, 30, 'CDF', true),

-- Tarifs livraison Kolwezi (CDF x1.1)
  ('delivery', 'flash', 'kolwezi', 5500, 1100, 0, 5500, 1.0, 0, 5, 30, 'CDF', true),
  ('delivery', 'flex', 'kolwezi', 60500, 2750, 0, 60500, 1.0, 0, 5, 30, 'CDF', true),
  ('delivery', 'maxicharge', 'kolwezi', 110000, 5500, 0, 110000, 1.0, 0, 5, 30, 'CDF', true);
