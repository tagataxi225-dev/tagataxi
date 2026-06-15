-- Create rental subscription plans table
CREATE TABLE public.rental_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.rental_vehicle_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner rental subscriptions table
CREATE TABLE public.partner_rental_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.rental_subscription_plans(id),
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT DEFAULT 'mobile_money',
  grace_period_end TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rental subscription payments table
CREATE TABLE public.rental_subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.partner_rental_subscriptions(id),
  partner_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  payment_method TEXT NOT NULL DEFAULT 'mobile_money',
  provider TEXT,
  phone_number TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.rental_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rental_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_subscription_plans
CREATE POLICY "Everyone can view active subscription plans"
ON public.rental_subscription_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.rental_subscription_plans
FOR ALL
USING (has_permission(auth.uid(), 'admin_write'::permission));

-- RLS Policies for partner_rental_subscriptions
CREATE POLICY "Partners can view their own subscriptions"
ON public.partner_rental_subscriptions
FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create their own subscriptions"
ON public.partner_rental_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their own subscriptions"
ON public.partner_rental_subscriptions
FOR UPDATE
USING (auth.uid() = partner_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.partner_rental_subscriptions
FOR SELECT
USING (has_permission(auth.uid(), 'admin_read'::permission));

-- RLS Policies for rental_subscription_payments
CREATE POLICY "Partners can view their own payments"
ON public.rental_subscription_payments
FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "System can manage payments"
ON public.rental_subscription_payments
FOR ALL
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_rental_subscription_plans_updated_at
BEFORE UPDATE ON public.rental_subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_rental_subscriptions_updated_at
BEFORE UPDATE ON public.partner_rental_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans for each category
INSERT INTO public.rental_subscription_plans (category_id, name, description, monthly_price, features)
SELECT 
  id,
  name || ' - Abonnement Mensuel',
  'Abonnement mensuel pour publier vos véhicules ' || name,
  CASE 
    WHEN name = 'Eco' THEN 25000
    WHEN name = 'Premium' THEN 50000
    WHEN name = 'First Class' THEN 100000
    WHEN name = 'Utility' THEN 35000
    ELSE 30000
  END,
  jsonb_build_array(
    'Visibilité sur l''application client',
    'Support prioritaire',
    'Statistiques détaillées',
    'Photos illimitées'
  )
FROM public.rental_vehicle_categories
WHERE is_active = true;

-- Function to check if vehicle subscription is active
CREATE OR REPLACE FUNCTION public.is_vehicle_subscription_active(vehicle_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_active BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.partner_rental_subscriptions 
    WHERE vehicle_id = vehicle_id_param 
      AND status = 'active'
      AND end_date > now()
  ) INTO subscription_active;
  
  RETURN subscription_active;
END;
$$;