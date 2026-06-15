-- Add missing columns to push_notifications
ALTER TABLE public.push_notifications 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;