
-- Add missing food permissions to the permission enum
ALTER TYPE public.permission ADD VALUE IF NOT EXISTS 'food_read';
ALTER TYPE public.permission ADD VALUE IF NOT EXISTS 'food_write';
ALTER TYPE public.permission ADD VALUE IF NOT EXISTS 'food_moderate';
ALTER TYPE public.permission ADD VALUE IF NOT EXISTS 'food_admin';
ALTER TYPE public.permission ADD VALUE IF NOT EXISTS 'vehicle_settings_manage';
