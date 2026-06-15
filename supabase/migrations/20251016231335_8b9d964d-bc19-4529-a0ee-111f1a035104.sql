-- Table de tracking des scans de QR codes
CREATE TABLE IF NOT EXISTS public.qr_code_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP WITH TIME ZONE,
  city TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performances
CREATE INDEX IF NOT EXISTS idx_qr_scans_channel ON public.qr_code_scans(channel_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_date ON public.qr_code_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_converted ON public.qr_code_scans(converted);
CREATE INDEX IF NOT EXISTS idx_qr_scans_utm_source ON public.qr_code_scans(utm_source);

-- RLS policies
ALTER TABLE public.qr_code_scans ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all QR scans"
  ON public.qr_code_scans
  FOR SELECT
  USING (is_current_user_admin());

-- Insertion publique (pour tracking)
CREATE POLICY "Anyone can insert QR scans"
  ON public.qr_code_scans
  FOR INSERT
  WITH CHECK (true);