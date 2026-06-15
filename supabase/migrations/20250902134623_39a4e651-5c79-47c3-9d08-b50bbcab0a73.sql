-- CRITICAL: Fix Admin Personal Information Exposure - CORRECTED
-- Secure the admins table from unauthorized access

-- First, create audit logging for admin data access (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_by UUID NOT NULL,
  target_admin_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  access_reason TEXT,
  sensitive_data_accessed JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin access logs (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_access_logs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies on admin_access_logs and recreate
DROP POLICY IF EXISTS "Only super admins can view admin access logs" ON public.admin_access_logs;
DROP POLICY IF EXISTS "System can insert admin access logs" ON public.admin_access_logs;

-- Create policies for admin access logs
CREATE POLICY "Only super admins can view admin access logs"
ON public.admin_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND admin_level = 'super_admin' 
    AND is_active = true
  )
);

CREATE POLICY "System can insert admin access logs"
ON public.admin_access_logs
FOR INSERT
WITH CHECK (true);

-- CRITICAL: Remove any overly permissive policies on admins table
-- Drop ALL existing policies to rebuild them securely
DROP POLICY IF EXISTS "Admins peuvent gérer leur propre profil" ON public.admins;
DROP POLICY IF EXISTS "Super admins peuvent voir tous les admins" ON public.admins;
DROP POLICY IF EXISTS "Public can view admins" ON public.admins;
DROP POLICY IF EXISTS "Anyone can view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can manage their own profile" ON public.admins;
DROP POLICY IF EXISTS "Super admins can view all admin profiles" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admin profiles" ON public.admins;
DROP POLICY IF EXISTS "Super admins can create admin accounts" ON public.admins;

-- Create secure policies for admins table
-- 1. Admins can only view and update their own profile
CREATE POLICY "Admins can manage their own profile"
ON public.admins
FOR ALL
USING (auth.uid() = user_id AND is_active = true)
WITH CHECK (auth.uid() = user_id AND is_active = true);

-- 2. Super admins can view all admin profiles (with audit logging)
CREATE POLICY "Super admins can view all admin profiles"
ON public.admins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.admin_level = 'super_admin' 
    AND admin_check.is_active = true
  )
);

-- 3. Super admins can update other admin profiles
CREATE POLICY "Super admins can update admin profiles"
ON public.admins
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admins admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.admin_level = 'super_admin' 
    AND admin_check.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.admin_level = 'super_admin' 
    AND admin_check.is_active = true
  )
);

-- 4. Only super admins can create new admin accounts
CREATE POLICY "Super admins can create admin accounts"
ON public.admins
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.admin_level = 'super_admin' 
    AND admin_check.is_active = true
  )
);

-- Create audit function for admin data access
CREATE OR REPLACE FUNCTION public.audit_admin_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Audit any access to admin data by non-super-admins
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    -- Check if accessor is a super admin
    IF NOT EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() 
      AND admin_level = 'super_admin' 
      AND is_active = true
    ) THEN
      -- Log unauthorized access attempt
      INSERT INTO public.admin_access_logs (
        accessed_by, target_admin_id, access_type, access_reason,
        sensitive_data_accessed
      ) VALUES (
        auth.uid(), NEW.id, 'unauthorized_admin_access', 'Non-super-admin accessed admin data',
        jsonb_build_object(
          'admin_level', NEW.admin_level,
          'department', NEW.department,
          'permissions', NEW.permissions,
          'employee_id', NEW.employee_id
        )
      );
    ELSE
      -- Log legitimate super admin access
      INSERT INTO public.admin_access_logs (
        accessed_by, target_admin_id, access_type, access_reason,
        sensitive_data_accessed
      ) VALUES (
        auth.uid(), NEW.id, 'super_admin_access', 'Super admin accessed admin data',
        jsonb_build_object(
          'admin_level', NEW.admin_level,
          'department', NEW.department
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create protected function to get admin info safely
CREATE OR REPLACE FUNCTION public.get_protected_admin_info(admin_id_param uuid)
RETURNS TABLE(
  user_id uuid, 
  display_name text, 
  department text, 
  admin_level text,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access admin information';
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.admin_access_logs (
    accessed_by, target_admin_id, access_type, access_reason
  ) VALUES (
    auth.uid(), admin_id_param, 'protected_admin_info_access', 'Accessed admin via protected function'
  );
  
  -- Return limited admin information based on access level
  IF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND admin_level = 'super_admin' 
    AND is_active = true
  ) THEN
    -- Super admin can see more details
    RETURN QUERY
    SELECT 
      a.user_id,
      a.display_name,
      a.department,
      a.admin_level,
      a.is_active,
      a.created_at
    FROM public.admins a
    WHERE a.id = admin_id_param;
  ELSIF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  ) THEN
    -- Regular admin can see limited info
    RETURN QUERY
    SELECT 
      a.user_id,
      CASE 
        WHEN a.user_id = auth.uid() THEN a.display_name 
        ELSE 'Admin User'
      END as display_name,
      CASE 
        WHEN a.user_id = auth.uid() THEN a.department 
        ELSE NULL
      END as department,
      CASE 
        WHEN a.user_id = auth.uid() THEN a.admin_level 
        ELSE 'admin'
      END as admin_level,
      a.is_active,
      a.created_at
    FROM public.admins a
    WHERE a.id = admin_id_param;
  ELSE
    -- Non-admin gets no access
    RAISE EXCEPTION 'Insufficient permissions to access admin information';
  END IF;
END;
$$;