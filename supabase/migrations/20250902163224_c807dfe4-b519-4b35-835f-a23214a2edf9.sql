-- Phase 1: Amélioration de la base de données pour le workflow de livraison

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

-- Créer une table pour l'historique des statuts
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  changed_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  location_coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS sur la nouvelle table
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'historique des statuts
CREATE POLICY "delivery_status_history_access" ON delivery_status_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM delivery_orders do
    WHERE do.id = delivery_order_id
    AND (auth.uid() = do.user_id OR auth.uid() = do.driver_id OR is_current_user_admin())
  )
);

-- Fonction pour enregistrer automatiquement les changements de statut
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Enregistrer le changement de statut si le statut a changé
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO delivery_status_history (
      delivery_order_id, 
      status, 
      previous_status, 
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      OLD.status,
      auth.uid(),
      'Changement de statut automatique'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour enregistrer les changements de statut
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON delivery_orders;
CREATE TRIGGER delivery_status_change_trigger
  AFTER UPDATE ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();

-- Activer les notifications temps réel pour les commandes de livraison
ALTER TABLE delivery_orders REPLICA IDENTITY FULL;
ALTER TABLE delivery_status_history REPLICA IDENTITY FULL;

-- Ajouter les tables aux publications realtime
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_status_history;