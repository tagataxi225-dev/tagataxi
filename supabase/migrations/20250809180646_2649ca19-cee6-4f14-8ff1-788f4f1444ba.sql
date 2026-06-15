-- Create support_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.enhanced_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_messages
CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enhanced_support_tickets 
    WHERE id = support_messages.ticket_id 
    AND user_id = auth.uid()
  )
  OR sender_id = auth.uid()
);

CREATE POLICY "Users can create messages for their tickets" ON public.support_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enhanced_support_tickets 
    WHERE id = support_messages.ticket_id 
    AND user_id = auth.uid()
  )
  OR sender_id = auth.uid()
);

CREATE POLICY "Admins can manage all support messages" ON public.support_messages
FOR ALL USING (has_permission(auth.uid(), 'support_admin'::permission));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON public.support_messages(sender_id);

-- Update RLS policies for enhanced_support_tickets to include admins
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.enhanced_support_tickets;
CREATE POLICY "Users can view their own tickets" ON public.enhanced_support_tickets
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_permission(auth.uid(), 'support_admin'::permission)
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.enhanced_support_tickets;
CREATE POLICY "Users can update their own tickets" ON public.enhanced_support_tickets
FOR UPDATE USING (
  auth.uid() = user_id 
  OR has_permission(auth.uid(), 'support_admin'::permission)
  OR assigned_to = auth.uid()
);

-- Admin policies for enhanced_support_tickets
CREATE POLICY "Admins can manage all tickets" ON public.enhanced_support_tickets
FOR ALL USING (has_permission(auth.uid(), 'support_admin'::permission));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_support_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION update_support_messages_updated_at();