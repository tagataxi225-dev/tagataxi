-- Add product moderation system
-- First, add status column to marketplace_products for moderation
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'active', 'inactive'));

-- Update existing products to be approved (backward compatibility)
UPDATE marketplace_products SET moderation_status = 'approved' WHERE status = 'active';

-- Create product moderation logs table
CREATE TABLE IF NOT EXISTS product_moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'pending')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  admin_notes TEXT,
  changes_made JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on moderation logs
ALTER TABLE product_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation logs
CREATE POLICY "Sellers can view logs for their products" 
ON product_moderation_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM marketplace_products 
  WHERE marketplace_products.id = product_moderation_logs.product_id 
  AND marketplace_products.seller_id = auth.uid()
));

CREATE POLICY "System can insert moderation logs" 
ON product_moderation_logs 
FOR INSERT 
WITH CHECK (true);

-- Update marketplace_products RLS policy to include moderation status
DROP POLICY IF EXISTS "Everyone can view active products" ON marketplace_products;

CREATE POLICY "Everyone can view approved products" 
ON marketplace_products 
FOR SELECT 
USING (
  (moderation_status = 'approved' AND status = 'active') 
  OR (auth.uid() = seller_id)
);

-- Create trigger to update moderation status when product status changes
CREATE OR REPLACE FUNCTION update_product_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from active to something else, update moderation status
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    NEW.moderation_status = 'inactive';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_moderation_status_trigger
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_moderation_status();

-- Add updated_at trigger for moderation logs
CREATE TRIGGER update_moderation_logs_updated_at
BEFORE UPDATE ON product_moderation_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Improve messages table for better chat functionality
-- Add message status and reply functionality
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_status TEXT DEFAULT 'sent' CHECK (message_status IN ('sent', 'delivered', 'read')),
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_product_moderation_status ON marketplace_products(moderation_status, created_at);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_notifications BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Add updated_at trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();