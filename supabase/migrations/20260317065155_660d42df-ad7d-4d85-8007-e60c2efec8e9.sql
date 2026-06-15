
-- Add missing columns to escrow_transactions for admin management
ALTER TABLE public.escrow_transactions 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolution_type TEXT;

-- Add index for dispute queries
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON public.escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_dispute ON public.escrow_transactions(status) WHERE status = 'disputed';
