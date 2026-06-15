-- Corriger les tarifs avec chauffeur (ajouter +30% si driver_available = true et tarifs = 0)
UPDATE rental_vehicles
SET 
  with_driver_hourly_rate = CASE 
    WHEN driver_available = true AND with_driver_hourly_rate = 0 AND without_driver_hourly_rate > 0
    THEN ROUND(without_driver_hourly_rate * 1.3)
    WHEN driver_available = true AND with_driver_hourly_rate = 0 AND hourly_rate > 0
    THEN ROUND(hourly_rate * 1.3)
    ELSE with_driver_hourly_rate 
  END,
  with_driver_daily_rate = CASE 
    WHEN driver_available = true AND with_driver_daily_rate = 0 AND without_driver_daily_rate > 0
    THEN ROUND(without_driver_daily_rate * 1.3)
    WHEN driver_available = true AND with_driver_daily_rate = 0 AND daily_rate > 0
    THEN ROUND(daily_rate * 1.3)
    ELSE with_driver_daily_rate 
  END,
  with_driver_weekly_rate = CASE 
    WHEN driver_available = true AND with_driver_weekly_rate = 0 AND without_driver_weekly_rate > 0
    THEN ROUND(without_driver_weekly_rate * 1.3)
    WHEN driver_available = true AND with_driver_weekly_rate = 0 AND weekly_rate > 0
    THEN ROUND(weekly_rate * 1.3)
    ELSE with_driver_weekly_rate 
  END
WHERE driver_available = true;

-- Pour les véhicules sans chauffeur, s'assurer que without_driver_* a les bonnes valeurs
UPDATE rental_vehicles
SET 
  without_driver_hourly_rate = CASE 
    WHEN without_driver_hourly_rate = 0 THEN hourly_rate 
    ELSE without_driver_hourly_rate 
  END,
  without_driver_daily_rate = CASE 
    WHEN without_driver_daily_rate = 0 THEN daily_rate 
    ELSE without_driver_daily_rate 
  END,
  without_driver_weekly_rate = CASE 
    WHEN without_driver_weekly_rate = 0 THEN weekly_rate 
    ELSE without_driver_weekly_rate 
  END
WHERE without_driver_daily_rate = 0 OR without_driver_hourly_rate = 0 OR without_driver_weekly_rate = 0;