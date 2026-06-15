-- Add partner profiles table
CREATE TABLE public.partner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  tax_number TEXT,
  license_number TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending',
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partner_profiles
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for partner_profiles
CREATE POLICY "Partners can view their own profile" 
ON public.partner_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Partners can create their own profile" 
ON public.partner_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile" 
ON public.partner_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add partner_id and validation fields to driver_requests
ALTER TABLE public.driver_requests 
ADD COLUMN partner_id UUID,
ADD COLUMN validated_by UUID,
ADD COLUMN validation_level TEXT DEFAULT 'none',
ADD COLUMN validation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN validation_comments TEXT;

-- Create validation_history table for tracking validation steps
CREATE TABLE public.validation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  validator_id UUID NOT NULL,
  validation_type TEXT NOT NULL, -- 'partner' or 'admin'
  action TEXT NOT NULL, -- 'approved', 'rejected', 'pending'
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on validation_history
ALTER TABLE public.validation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for validation_history
CREATE POLICY "Users can view validation history for their requests" 
ON public.validation_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.driver_requests 
    WHERE id = validation_history.request_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid() OR validated_by = auth.uid())
  )
);

CREATE POLICY "System can insert validation history" 
ON public.validation_history 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at on partner_profiles
CREATE TRIGGER update_partner_profiles_updated_at
BEFORE UPDATE ON public.partner_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();