-- Create vendor notifications table
CREATE TABLE public.vendor_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  order_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  sound_played BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create vendor earnings table
CREATE TABLE public.vendor_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid
  earnings_type TEXT NOT NULL DEFAULT 'sale', -- sale, commission, bonus
  confirmed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- cash, kwenda_pay, bank_transfer
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_notifications
CREATE POLICY "Vendors can view their own notifications" 
ON public.vendor_notifications 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own notifications" 
ON public.vendor_notifications 
FOR UPDATE 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can create vendor notifications" 
ON public.vendor_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for vendor_earnings
CREATE POLICY "Vendors can view their own earnings" 
ON public.vendor_earnings 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can manage vendor earnings" 
ON public.vendor_earnings 
FOR ALL 
USING (true);

-- Add new statuses to marketplace_orders
ALTER TABLE public.marketplace_orders 
ADD COLUMN IF NOT EXISTS vendor_confirmation_status TEXT DEFAULT 'awaiting_confirmation',
ADD COLUMN IF NOT EXISTS vendor_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vendor_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS revenue_status TEXT DEFAULT 'pending'; -- pending, confirmed, paid

-- Create indexes for performance
CREATE INDEX idx_vendor_notifications_vendor_id ON public.vendor_notifications(vendor_id);
CREATE INDEX idx_vendor_notifications_unread ON public.vendor_notifications(vendor_id, is_read) WHERE is_read = false;
CREATE INDEX idx_vendor_earnings_vendor_id ON public.vendor_earnings(vendor_id);
CREATE INDEX idx_vendor_earnings_status ON public.vendor_earnings(vendor_id, status);
CREATE INDEX idx_marketplace_orders_vendor_confirmation ON public.marketplace_orders(seller_id, vendor_confirmation_status);

-- Create trigger for updated_at on vendor_earnings
CREATE TRIGGER update_vendor_earnings_updated_at
BEFORE UPDATE ON public.vendor_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create vendor notification on new order
CREATE OR REPLACE FUNCTION public.create_vendor_notification_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new order
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vendor_notifications (
      vendor_id,
      order_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.seller_id,
      NEW.id,
      'new_order',
      'Nouvelle commande reçue',
      'Vous avez reçu une nouvelle commande à confirmer',
      jsonb_build_object(
        'order_id', NEW.id,
        'buyer_id', NEW.buyer_id,
        'total_amount', NEW.total_amount,
        'product_id', NEW.product_id
      )
    );
    
    -- Create pending earnings record
    INSERT INTO public.vendor_earnings (
      vendor_id,
      order_id,
      amount,
      currency,
      status,
      earnings_type
    ) VALUES (
      NEW.seller_id,
      NEW.id,
      NEW.total_amount,
      'CDF',
      'pending',
      'sale'
    );
  END IF;
  
  -- Create notification for order confirmation
  IF TG_OP = 'UPDATE' AND OLD.vendor_confirmation_status = 'awaiting_confirmation' 
     AND NEW.vendor_confirmation_status = 'confirmed' THEN
    INSERT INTO public.vendor_notifications (
      vendor_id,
      order_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.buyer_id, -- Notify the buyer
      NEW.id,
      'order_confirmed',
      'Commande confirmée',
      'Votre commande a été confirmée par le vendeur',
      jsonb_build_object(
        'order_id', NEW.id,
        'seller_id', NEW.seller_id
      )
    );
    
    -- Update earnings status
    UPDATE public.vendor_earnings 
    SET status = 'confirmed', confirmed_at = now()
    WHERE order_id = NEW.id AND vendor_id = NEW.seller_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor notifications
CREATE TRIGGER trigger_vendor_notification_on_order
AFTER INSERT OR UPDATE ON public.marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_vendor_notification_on_order();