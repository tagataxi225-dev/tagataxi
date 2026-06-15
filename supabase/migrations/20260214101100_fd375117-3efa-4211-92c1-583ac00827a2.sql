
-- Correction 1: Colonnes manquantes pour driver_fraud_tracking
ALTER TABLE public.driver_fraud_tracking ADD COLUMN IF NOT EXISTS unpaid_commissions_count INTEGER DEFAULT 0;
ALTER TABLE public.driver_fraud_tracking ADD COLUMN IF NOT EXISTS warning_level INTEGER DEFAULT 0;
ALTER TABLE public.driver_fraud_tracking ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.driver_fraud_tracking ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.driver_fraud_tracking ADD COLUMN IF NOT EXISTS last_fraud_detected_at TIMESTAMPTZ;

-- Correction 2: Nettoyage campagnes orphelines
UPDATE public.notification_campaign_history 
SET status = 'failed' 
WHERE status = 'sending' AND sent_at IS NULL AND created_at < '2026-02-01';
