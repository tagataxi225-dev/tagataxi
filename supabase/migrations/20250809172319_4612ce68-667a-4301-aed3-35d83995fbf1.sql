-- First, assign admin role to the current user if they don't have one
DO $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user has any role, if not assign super_admin
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id) THEN
        INSERT INTO public.user_roles (user_id, role, admin_role, is_active)
        VALUES (current_user_id, 'admin', 'super_admin', true);
    END IF;
END $$;

-- Update RLS policies for pricing_rules to be more flexible
DROP POLICY IF EXISTS "Finance admins can manage pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Everyone can view active pricing rules" ON public.pricing_rules;

-- Create new, more flexible policies
CREATE POLICY "Admins can manage pricing rules" 
ON public.pricing_rules 
FOR ALL
USING (
  has_permission(auth.uid(), 'finance_admin'::permission) OR
  has_permission(auth.uid(), 'finance_write'::permission) OR
  has_permission(auth.uid(), 'system_admin'::permission)
);

CREATE POLICY "Everyone can view pricing rules" 
ON public.pricing_rules 
FOR SELECT
USING (true);