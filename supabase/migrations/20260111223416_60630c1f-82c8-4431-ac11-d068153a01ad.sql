-- Policy permettant aux utilisateurs de lire les profils des participants de leurs conversations
CREATE POLICY "Users can read profiles of conversation participants"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT participant_1 FROM unified_conversations 
    WHERE participant_2 = auth.uid()
    UNION
    SELECT participant_2 FROM unified_conversations 
    WHERE participant_1 = auth.uid()
  )
);