-- Create unified chat tables for cross-service messaging
-- 1) Conversations table
CREATE TABLE IF NOT EXISTS public.unified_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL CHECK (context_type IN ('transport','delivery','marketplace','rental','support')),
  context_id UUID NULL,
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  title TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NULL
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_unified_conversations_participants ON public.unified_conversations (participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_unified_conversations_participants_rev ON public.unified_conversations (participant_2, participant_1);
CREATE INDEX IF NOT EXISTS idx_unified_conversations_context ON public.unified_conversations (context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_unified_conversations_last_message_at ON public.unified_conversations (last_message_at DESC NULLS LAST);

-- 2) Messages table
CREATE TABLE IF NOT EXISTS public.unified_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.unified_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_unified_messages_conversation ON public.unified_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_unified_messages_conversation_created_at ON public.unified_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_messages_conversation_unread ON public.unified_messages (conversation_id, is_read);

-- Enable Row Level Security
ALTER TABLE public.unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY IF NOT EXISTS "participants can read conversations"
ON public.unified_conversations
FOR SELECT
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY IF NOT EXISTS "participants can update conversations"
ON public.unified_conversations
FOR UPDATE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY IF NOT EXISTS "participants can insert conversations"
ON public.unified_conversations
FOR INSERT
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- RLS policies for messages
CREATE POLICY IF NOT EXISTS "participants can read messages"
ON public.unified_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.unified_conversations c
  WHERE c.id = unified_messages.conversation_id
    AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
));

CREATE POLICY IF NOT EXISTS "sender can insert messages"
ON public.unified_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.unified_conversations c
    WHERE c.id = unified_messages.conversation_id
      AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
  )
);

CREATE POLICY IF NOT EXISTS "participants can update messages"
ON public.unified_messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.unified_conversations c
  WHERE c.id = unified_messages.conversation_id
    AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
));

-- Triggers to maintain updated_at using existing helper
DROP TRIGGER IF EXISTS update_unified_conversations_updated_at ON public.unified_conversations;
CREATE TRIGGER update_unified_conversations_updated_at
BEFORE UPDATE ON public.unified_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_unified_messages_updated_at ON public.unified_messages;
CREATE TRIGGER update_unified_messages_updated_at
BEFORE UPDATE ON public.unified_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- After-insert trigger to bump last_message_at on conversation
CREATE OR REPLACE FUNCTION public.bump_unified_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.unified_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_unified_messages_bump_last ON public.unified_messages;
CREATE TRIGGER trg_unified_messages_bump_last
AFTER INSERT ON public.unified_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_unified_conversation_last_message_at();

-- Realtime support
ALTER TABLE public.unified_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.unified_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  -- Add to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'unified_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_conversations;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'unified_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_messages;
  END IF;
END $$;