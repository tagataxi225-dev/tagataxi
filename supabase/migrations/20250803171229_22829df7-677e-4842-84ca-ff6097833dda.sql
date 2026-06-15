-- Zone Management Extended
CREATE TABLE public.service_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  coordinates JSONB NOT NULL, -- Polygon coordinates
  is_active BOOLEAN NOT NULL DEFAULT true,
  base_price NUMERIC NOT NULL DEFAULT 500,
  price_per_km NUMERIC NOT NULL DEFAULT 150,
  price_per_minute NUMERIC NOT NULL DEFAULT 25,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('weekly', 'monthly')),
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  features JSONB NOT NULL DEFAULT '[]',
  max_rides_per_day INTEGER,
  priority_level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Driver Subscriptions
CREATE TABLE public.driver_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT NOT NULL,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  grace_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Driver Credits System
CREATE TABLE public.driver_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  last_topup_date TIMESTAMP WITH TIME ZONE,
  low_balance_alert_sent BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit Transactions
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('topup', 'deduction', 'refund', 'bonus')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  description TEXT NOT NULL,
  reference_type TEXT, -- 'ride', 'delivery', 'subscription', etc.
  reference_id UUID,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced Support Tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID,
  resolution_notes TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Notifications
CREATE TABLE public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_system_wide BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zone Analytics
CREATE TABLE public.zone_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.service_zones(id),
  date DATE NOT NULL,
  total_rides INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  active_drivers INTEGER NOT NULL DEFAULT 0,
  average_wait_time NUMERIC NOT NULL DEFAULT 0,
  customer_satisfaction NUMERIC NOT NULL DEFAULT 0,
  peak_hours JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(zone_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_zones
CREATE POLICY "Everyone can view active zones" ON public.service_zones
  FOR SELECT USING (is_active = true);

-- RLS Policies for subscription_plans
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- RLS Policies for driver_subscriptions
CREATE POLICY "Drivers can view their own subscriptions" ON public.driver_subscriptions
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create their own subscriptions" ON public.driver_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- RLS Policies for driver_credits
CREATE POLICY "Drivers can view their own credits" ON public.driver_credits
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "System can manage driver credits" ON public.driver_credits
  FOR ALL USING (true);

-- RLS Policies for credit_transactions
CREATE POLICY "Drivers can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "System can insert credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = support_messages.ticket_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = support_messages.ticket_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for system_notifications
CREATE POLICY "Users can view their notifications" ON public.system_notifications
  FOR SELECT USING (auth.uid() = user_id OR is_system_wide = true);

CREATE POLICY "Users can update their notifications" ON public.system_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for zone_analytics
CREATE POLICY "Everyone can view zone analytics" ON public.zone_analytics
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_service_zones_country_city ON public.service_zones(country_code, city);
CREATE INDEX idx_driver_subscriptions_driver_id ON public.driver_subscriptions(driver_id);
CREATE INDEX idx_driver_subscriptions_status ON public.driver_subscriptions(status);
CREATE INDEX idx_driver_credits_driver_id ON public.driver_credits(driver_id);
CREATE INDEX idx_credit_transactions_driver_id ON public.credit_transactions(driver_id);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_system_notifications_user_id ON public.system_notifications(user_id);
CREATE INDEX idx_zone_analytics_zone_date ON public.zone_analytics(zone_id, date);

-- Create triggers for updated_at
CREATE TRIGGER update_service_zones_updated_at
  BEFORE UPDATE ON public.service_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_subscriptions_updated_at
  BEFORE UPDATE ON public.driver_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_credits_updated_at
  BEFORE UPDATE ON public.driver_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, duration_type, price, features, max_rides_per_day, priority_level) VALUES
('Plan Hebdomadaire Basic', 'Accès basique pendant 7 jours', 'weekly', 5000, '["Visibilité normale", "Support standard"]', 10, 1),
('Plan Hebdomadaire Premium', 'Accès premium pendant 7 jours', 'weekly', 8000, '["Visibilité prioritaire", "Support premium", "Analytics"]', 20, 2),
('Plan Mensuel Basic', 'Accès basique pendant 30 jours', 'monthly', 18000, '["Visibilité normale", "Support standard"]', 10, 1),
('Plan Mensuel Premium', 'Accès premium pendant 30 jours', 'monthly', 28000, '["Visibilité prioritaire", "Support premium", "Analytics", "Commission réduite"]', 25, 2);

-- Generate ticket numbers function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate format: TKT-YYYYMMDD-XXXX
    ticket_num := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || 
                  LPAD(floor(random() * 9999 + 1)::text, 4, '0');
    
    SELECT COUNT(*) INTO exists_check FROM public.support_tickets WHERE ticket_number = ticket_num;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;