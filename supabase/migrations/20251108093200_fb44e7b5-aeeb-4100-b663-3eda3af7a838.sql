-- Migration pour auto-complétion des commandes marketplace après 7 jours
-- Cette fonction complète automatiquement les commandes livrées depuis plus de 7 jours

-- Fonction pour auto-compléter les commandes anciennes
CREATE OR REPLACE FUNCTION auto_complete_old_delivered_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  escrow_record RECORD;
  platform_fee_amount NUMERIC;
  seller_net_amount NUMERIC;
BEGIN
  -- Récupérer toutes les commandes livrées depuis plus de 7 jours non complétées
  FOR order_record IN 
    SELECT 
      mo.id,
      mo.seller_id,
      mo.total_amount,
      mo.delivery_fee
    FROM marketplace_orders mo
    WHERE 
      mo.status = 'delivered'
      AND mo.delivered_at < NOW() - INTERVAL '7 days'
      AND mo.completed_at IS NULL
  LOOP
    BEGIN
      -- Marquer la commande comme complétée automatiquement
      UPDATE marketplace_orders
      SET 
        status = 'completed',
        completed_at = NOW(),
        auto_completed = true,
        updated_at = NOW()
      WHERE id = order_record.id;

      -- Récupérer l'escrow
      SELECT * INTO escrow_record
      FROM escrow_transactions
      WHERE order_id = order_record.id
      AND status = 'held';

      IF FOUND THEN
        -- Calculer les montants
        platform_fee_amount := escrow_record.platform_fee;
        seller_net_amount := escrow_record.seller_amount;

        -- Libérer l'escrow
        UPDATE escrow_transactions
        SET 
          status = 'released',
          released_at = NOW(),
          updated_at = NOW()
        WHERE id = escrow_record.id;

        -- Créditer le vendeur (créer ou incrémenter wallet)
        INSERT INTO vendor_wallets (vendor_id, balance, total_earnings, currency, updated_at)
        VALUES (order_record.seller_id, seller_net_amount, seller_net_amount, 'CDF', NOW())
        ON CONFLICT (vendor_id) 
        DO UPDATE SET
          balance = vendor_wallets.balance + seller_net_amount,
          total_earnings = vendor_wallets.total_earnings + seller_net_amount,
          updated_at = NOW();

        -- Logger la transaction vendeur
        INSERT INTO vendor_wallet_transactions (
          vendor_id,
          amount,
          transaction_type,
          description,
          status,
          reference_type,
          reference_id,
          created_at
        ) VALUES (
          order_record.seller_id,
          seller_net_amount,
          'marketplace_sale',
          'Paiement automatique (7 jours) - Commande #' || SUBSTRING(order_record.id::text, 1, 8),
          'completed',
          'marketplace_order',
          order_record.id,
          NOW()
        );

        -- Logger la commission plateforme
        INSERT INTO vendor_wallet_transactions (
          vendor_id,
          amount,
          transaction_type,
          description,
          status,
          reference_type,
          reference_id,
          created_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', -- ID système pour la plateforme
          platform_fee_amount,
          'platform_commission',
          'Commission (5%) - Commande #' || SUBSTRING(order_record.id::text, 1, 8),
          'completed',
          'marketplace_order',
          order_record.id,
          NOW()
        );

        -- Mettre à jour le statut de revenu de la commande
        UPDATE marketplace_orders
        SET revenue_status = 'paid'
        WHERE id = order_record.id;

        -- Notifier le vendeur
        INSERT INTO system_notifications (
          user_id,
          title,
          message,
          notification_type,
          data,
          created_at
        ) VALUES (
          order_record.seller_id,
          'Paiement libéré automatiquement',
          'Votre paiement a été automatiquement libéré après 7 jours. Montant: ' || seller_net_amount || ' CDF',
          'payment_released',
          jsonb_build_object('order_id', order_record.id, 'amount', seller_net_amount, 'auto_completed', true),
          NOW()
        );

        RAISE NOTICE 'Order % auto-completed and payment released', order_record.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Logger l'erreur mais continuer avec les autres commandes
      RAISE WARNING 'Error auto-completing order %: %', order_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- Créer le cron job pour exécuter quotidiennement à 2h du matin
-- Nécessite l'extension pg_cron
SELECT cron.schedule(
  'auto-complete-delivered-orders',
  '0 2 * * *', -- Tous les jours à 2h du matin
  $$SELECT auto_complete_old_delivered_orders()$$
);

-- Ajouter une colonne pour tracker les complétions auto (si pas déjà existante)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_orders' 
    AND column_name = 'auto_completed'
  ) THEN
    ALTER TABLE marketplace_orders ADD COLUMN auto_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Créer un index pour optimiser la requête de recherche
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_auto_complete 
ON marketplace_orders(status, delivered_at, completed_at)
WHERE status = 'delivered' AND completed_at IS NULL;