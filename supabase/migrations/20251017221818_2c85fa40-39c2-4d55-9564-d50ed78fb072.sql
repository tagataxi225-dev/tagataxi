-- Create marketplace_chats table
CREATE TABLE IF NOT EXISTS public.marketplace_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketplace_messages table
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.marketplace_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_chats
CREATE POLICY "chat_participants_access" 
  ON public.marketplace_chats 
  FOR ALL 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for marketplace_messages
CREATE POLICY "message_participants_access" 
  ON public.marketplace_messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_chats 
      WHERE id = chat_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_chats_buyer ON public.marketplace_chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_chats_seller ON public.marketplace_chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_chats_product ON public.marketplace_chats(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_chat ON public.marketplace_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_unread ON public.marketplace_messages(is_read) WHERE is_read = false;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketplace_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_marketplace_chats_updated_at
  BEFORE UPDATE ON public.marketplace_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_chat_timestamp();

CREATE TRIGGER update_marketplace_messages_updated_at
  BEFORE UPDATE ON public.marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_chat_timestamp();