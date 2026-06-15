-- ✅ PHASE 1: Fonction helper pour vérifier la participation à une conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.unified_conversations
    WHERE id = _conversation_id
    AND (_user_id = participant_1 OR _user_id = participant_2)
  )
$$;

-- ✅ PHASE 2: Politiques RLS pour unified_conversations

-- Permettre aux utilisateurs de voir leurs propres conversations
CREATE POLICY "Users can view their own conversations"
ON public.unified_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- Permettre aux utilisateurs de créer des conversations où ils sont participants
CREATE POLICY "Users can create conversations they participate in"
ON public.unified_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- Permettre aux utilisateurs de mettre à jour leurs propres conversations (last_message_at, etc.)
CREATE POLICY "Users can update their own conversations"
ON public.unified_conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
)
WITH CHECK (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- ✅ PHASE 3: Politiques RLS pour unified_messages

-- Permettre aux utilisateurs de voir les messages de leurs conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.unified_messages
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- Permettre aux utilisateurs d'envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in their conversations"
ON public.unified_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_participant(conversation_id, auth.uid())
);

-- Permettre aux utilisateurs de marquer les messages comme lus
CREATE POLICY "Users can mark messages as read"
ON public.unified_messages
FOR UPDATE
TO authenticated
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
)
WITH CHECK (
  public.is_conversation_participant(conversation_id, auth.uid())
);