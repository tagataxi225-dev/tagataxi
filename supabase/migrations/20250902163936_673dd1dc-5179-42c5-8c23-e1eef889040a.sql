-- Phase 1: Amélioration de la base de données pour le workflow de livraison (simplifiée)

-- Ajouter les colonnes manquantes pour tracker chaque étape de livraison
ALTER TABLE delivery_orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_proof JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS recipient_signature TEXT,
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;