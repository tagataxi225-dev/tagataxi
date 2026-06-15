-- Make order_id nullable in vendor_notifications since product notifications don't have an associated order
ALTER TABLE public.vendor_notifications
ALTER COLUMN order_id DROP NOT NULL;