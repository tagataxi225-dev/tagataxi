-- Phase 2: Add missing table modifications and sample data
-- Fix team_accounts table by adding missing status column
ALTER TABLE public.team_accounts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));

-- Update existing teams to have active status
UPDATE public.team_accounts SET status = 'active' WHERE status IS NULL;

-- Create sample admin user with super_admin role (if none exists)
DO $$ 
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if any super admin exists
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE role = 'admin' AND admin_role = 'super_admin' AND is_active = true
    ) THEN
        -- Get the first authenticated user ID (assuming it's an admin)
        SELECT id INTO admin_user_id 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            -- Assign super admin role
            INSERT INTO public.user_roles (user_id, role, admin_role, assigned_by, is_active)
            VALUES (admin_user_id, 'admin', 'super_admin', admin_user_id, true)
            ON CONFLICT (user_id, role, admin_role) DO NOTHING;
        END IF;
    END IF;
END $$;