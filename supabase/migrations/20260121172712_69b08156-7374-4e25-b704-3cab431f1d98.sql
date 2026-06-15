-- ================================================
-- CORRECTION COMPLETE DU SYSTEME DE MESSAGERIE
-- ================================================

-- ETAPE 1: Réinitialiser les flags de suppression incorrects
UPDATE unified_conversations 
SET deleted_by_participant_1 = false,
    deleted_by_participant_2 = false
WHERE deleted_by_participant_1 = true 
   OR deleted_by_participant_2 = true;

-- ETAPE 2: Supprimer les politiques SELECT conflictuelles sur unified_conversations
DROP POLICY IF EXISTS "Users can view their non-deleted conversations" ON unified_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON unified_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON unified_conversations;

-- ETAPE 3: Créer une politique SELECT unique et cohérente
CREATE POLICY "Users can view their conversations"
ON unified_conversations FOR SELECT TO authenticated
USING (
  (auth.uid() = participant_1 AND (deleted_by_participant_1 IS NULL OR deleted_by_participant_1 = false))
  OR 
  (auth.uid() = participant_2 AND (deleted_by_participant_2 IS NULL OR deleted_by_participant_2 = false))
);

-- ETAPE 4: Recréer la fonction is_conversation_participant avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
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

-- ETAPE 5: Simplifier les politiques sur unified_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON unified_messages;

CREATE POLICY "Users can view messages in their conversations"
ON unified_messages FOR SELECT TO authenticated
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- S'assurer que les politiques INSERT/UPDATE/DELETE existent
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON unified_messages;
CREATE POLICY "Users can send messages to their conversations"
ON unified_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND public.is_conversation_participant(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own messages" ON unified_messages;
CREATE POLICY "Users can update their own messages"
ON unified_messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON unified_messages;
CREATE POLICY "Users can delete their own messages"
ON unified_messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);