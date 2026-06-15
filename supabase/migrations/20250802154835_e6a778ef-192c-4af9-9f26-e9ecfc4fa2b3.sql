-- Create user wallets table for Kwenda Pay
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for user_wallets
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
ON public.user_wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallets" 
ON public.user_wallets 
FOR UPDATE 
USING (true);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'CDF',
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_logs
CREATE POLICY "Users can view their own activity" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Create commission settings table
CREATE TABLE public.commission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL, -- 'transport' or 'delivery'
  admin_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- percentage
  driver_rate NUMERIC(5,2) NOT NULL DEFAULT 85.00, -- percentage
  platform_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- percentage
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on commission_settings
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for commission_settings (admin only)
CREATE POLICY "Everyone can view commission settings" 
ON public.commission_settings 
FOR SELECT 
USING (true);

-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit', 'commission'
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT, -- 'booking', 'delivery', 'topup', 'commission'
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.commission_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission settings
INSERT INTO public.commission_settings (service_type, admin_rate, driver_rate, platform_rate) VALUES
('transport', 15.00, 80.00, 5.00),
('delivery', 12.00, 83.00, 5.00);