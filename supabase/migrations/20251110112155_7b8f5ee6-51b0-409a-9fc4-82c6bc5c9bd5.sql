-- Migration: Ajouter colonnes driver à rental_bookings
-- Résout l'erreur: colonnes manquantes pour informations chauffeur

-- Ajouter colonnes pour informations chauffeur
ALTER TABLE rental_bookings 
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS driver_phone TEXT,
ADD COLUMN IF NOT EXISTS driver_email TEXT,
ADD COLUMN IF NOT EXISTS driver_license TEXT;

-- Documentation des colonnes
COMMENT ON COLUMN rental_bookings.driver_name IS 'Nom complet du chauffeur fourni par le client';
COMMENT ON COLUMN rental_bookings.driver_phone IS 'Numéro de téléphone du chauffeur';
COMMENT ON COLUMN rental_bookings.driver_email IS 'Email du chauffeur';
COMMENT ON COLUMN rental_bookings.driver_license IS 'Numéro de permis de conduire du chauffeur';

-- Index pour recherche rapide par chauffeur
CREATE INDEX IF NOT EXISTS idx_rental_bookings_driver_phone ON rental_bookings(driver_phone);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_driver_license ON rental_bookings(driver_license);