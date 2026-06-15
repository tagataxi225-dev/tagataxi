-- Activer RLS sur commission_history_archive
ALTER TABLE public.commission_history_archive ENABLE ROW LEVEL SECURITY;

-- Policy admin uniquement
CREATE POLICY "Admins can view commission archive"
  ON public.commission_history_archive
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

COMMENT ON POLICY "Admins can view commission archive" ON public.commission_history_archive 
IS 'Seuls les admins peuvent consulter l''archive des anciennes commissions';