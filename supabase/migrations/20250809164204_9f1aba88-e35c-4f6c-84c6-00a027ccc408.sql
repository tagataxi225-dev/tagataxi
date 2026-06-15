-- Première partie: Ajout des permissions pour les notifications dans l'enum permission
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'notifications_read';
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'notifications_write'; 
ALTER TYPE permission ADD VALUE IF NOT EXISTS 'notifications_admin';