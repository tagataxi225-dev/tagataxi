
-- Add loyalty columns to partenaires table (source table for partner_profiles view)
ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier text NOT NULL DEFAULT 'bronze';

-- Update the partner_profiles view to include loyalty columns
CREATE OR REPLACE VIEW public.partner_profiles AS
SELECT id,
    user_id,
    company_name,
    city,
    address,
    contact_person_name AS contact_email,
    contact_person_phone AS contact_phone,
    verification_status,
    is_active,
    created_at,
    updated_at,
    banner_image AS logo_url,
    shop_description AS description,
    bank_account_number,
    commission_rate,
    loyalty_points,
    loyalty_tier
FROM partenaires p;
