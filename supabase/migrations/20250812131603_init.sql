-- Create delivery escrow system
CREATE TABLE IF NOT EXISTS public.delivery_escrow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  driver_id UUID,
  vendor_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'held',
  held_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  auto_release_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delivery_escrow
ALTER TABLE public.delivery_escrow ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_escrow
CREATE POLICY "Users can view their own escrow" 
ON public.delivery_escrow 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = driver_id OR auth.uid() = vendor_id);

CREATE POLICY "System can manage escrow" 
ON public.delivery_escrow 
FOR ALL 
USING (true);

-- Create vendor earnings table
CREATE TABLE IF NOT EXISTS public.vendor_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  order_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'pending',
  earnings_type TEXT NOT NULL DEFAULT 'sale',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  available_at TIMESTAMP WITH TIME ZONE,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_earnings
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_earnings
CREATE POLICY "Vendors can view their own earnings" 
ON public.vendor_earnings 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can manage vendor earnings" 
ON public.vendor_earnings 
FOR ALL 
USING (true);

-- Create vendor withdrawals table
CREATE TABLE IF NOT EXISTS public.vendor_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_reference TEXT,
  fees NUMERIC DEFAULT 0,
  net_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_withdrawals
ALTER TABLE public.vendor_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_withdrawals
CREATE POLICY "Vendors can view their own withdrawals" 
ON public.vendor_withdrawals 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create withdrawal requests" 
ON public.vendor_withdrawals 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "System can manage withdrawals" 
ON public.vendor_withdrawals 
FOR ALL 
USING (true);

-- Add updated_at trigger for all new tables
CREATE TRIGGER update_delivery_escrow_updated_at
  BEFORE UPDATE ON public.delivery_escrow
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_earnings_updated_at
  BEFORE UPDATE ON public.vendor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_withdrawals_updated_at
  BEFORE UPDATE ON public.vendor_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();