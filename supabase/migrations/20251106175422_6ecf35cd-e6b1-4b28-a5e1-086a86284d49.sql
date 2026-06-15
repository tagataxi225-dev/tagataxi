-- Nettoyer les conversations auto-créées existantes
DELETE FROM unified_messages 
WHERE conversation_id IN (
  SELECT id FROM unified_conversations 
  WHERE participant_1 = participant_2
);

DELETE FROM unified_conversations 
WHERE participant_1 = participant_2;

-- Ajouter contrainte CHECK pour empêcher les conversations avec soi-même
ALTER TABLE unified_conversations 
ADD CONSTRAINT check_different_participants 
CHECK (participant_1 <> participant_2);