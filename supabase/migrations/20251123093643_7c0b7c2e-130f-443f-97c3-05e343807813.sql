-- ============================================
-- 📊 TRIGGER: Auto-create delivery status history
-- Phase 3: Créer automatiquement les entrées d'historique
-- ============================================

-- Fonction pour créer automatiquement l'historique des statuts
CREATE OR REPLACE FUNCTION create_delivery_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer une entrée d'historique pour les nouvelles commandes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO delivery_status_history (
      delivery_order_id,
      status,
      previous_status,
      changed_at,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      NULL,
      NEW.created_at,
      'Commande créée'
    );
  END IF;

  -- Insérer une entrée pour les changements de statut
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO delivery_status_history (
      delivery_order_id,
      status,
      previous_status,
      changed_at,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      OLD.status,
      NOW(),
      auth.uid(),
      'Statut mis à jour de ' || OLD.status || ' vers ' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur delivery_orders
DROP TRIGGER IF EXISTS delivery_status_history_trigger ON delivery_orders;
CREATE TRIGGER delivery_status_history_trigger
  AFTER INSERT OR UPDATE ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_status_history();

-- Créer les entrées manquantes pour les commandes existantes
INSERT INTO delivery_status_history (delivery_order_id, status, changed_at, notes)
SELECT id, status, created_at, 'Entrée historique créée automatiquement'
FROM delivery_orders
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_status_history 
  WHERE delivery_order_id = delivery_orders.id
)
ON CONFLICT DO NOTHING;