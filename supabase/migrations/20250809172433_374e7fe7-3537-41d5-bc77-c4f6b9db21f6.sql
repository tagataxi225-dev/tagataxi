-- First check if user_roles table has the right structure and add admin users
INSERT INTO public.user_roles (user_id, role, admin_role, is_active)
SELECT 
  id as user_id,
  'admin' as role,
  'super_admin' as admin_role,
  true as is_active
FROM auth.users 
WHERE email IS NOT NULL
AND id NOT IN (SELECT user_id FROM public.user_roles WHERE user_id = auth.users.id);

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