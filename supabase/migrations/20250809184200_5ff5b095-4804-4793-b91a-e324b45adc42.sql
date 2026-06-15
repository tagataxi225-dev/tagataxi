-- Ajouter les nouvelles permissions à l'énumération permission
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'zones_read';
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'zones_write';
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'zones_admin';
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'drivers_admin';