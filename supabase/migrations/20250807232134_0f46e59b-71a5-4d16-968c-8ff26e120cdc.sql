-- Create unified messaging system

-- Create unified conversations table
CREATE TABLE public.unified_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_type TEXT NOT NULL CHECK (context_type IN ('transport', 'delivery', 'marketplace', 'rental', 'support')),
  context_id UUID, -- ID of the booking/order/ticket etc.
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(context_type, context_id, participant_1, participant_2)
);

-- Create unified messages table
CREATE TABLE public.unified_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.unified_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'image', 'file', 'quick_action')),
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID REFERENCES public.unified_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.unified_conversations FOR SELECT
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations they participate in"
ON public.unified_conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own conversations"
ON public.unified_conversations FOR UPDATE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.unified_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.unified_conversations 
  WHERE id = conversation_id 
  AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
));

CREATE POLICY "Users can send messages in their conversations"
ON public.unified_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.unified_conversations 
    WHERE id = conversation_id 
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.unified_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX idx_unified_conversations_participants ON public.unified_conversations(participant_1, participant_2);
CREATE INDEX idx_unified_conversations_context ON public.unified_conversations(context_type, context_id);
CREATE INDEX idx_unified_messages_conversation ON public.unified_messages(conversation_id, created_at);
CREATE INDEX idx_unified_messages_unread ON public.unified_messages(conversation_id, is_read) WHERE is_read = false;

-- Triggers for updated_at
CREATE TRIGGER update_unified_conversations_updated_at
  BEFORE UPDATE ON public.unified_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_messages_updated_at
  BEFORE UPDATE ON public.unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_messages;