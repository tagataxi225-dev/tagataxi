
-- Fix: Drop the redundant public UPDATE policy that conflicts with the authenticated one
DROP POLICY IF EXISTS "Users can update their conversations" ON unified_conversations;

-- Recreate the authenticated policy with a permissive with_check
DROP POLICY IF EXISTS "Users can update their own conversations" ON unified_conversations;

CREATE POLICY "Users can update their own conversations"
ON unified_conversations
FOR UPDATE
TO authenticated
USING (
  participant_1 = auth.uid() OR participant_2 = auth.uid()
)
WITH CHECK (
  participant_1 = auth.uid() OR participant_2 = auth.uid()
);
