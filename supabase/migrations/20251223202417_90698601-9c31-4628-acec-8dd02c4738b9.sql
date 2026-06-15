-- Ajouter les colonnes de suppression soft pour chaque participant
ALTER TABLE unified_conversations 
ADD COLUMN IF NOT EXISTS deleted_by_participant_1 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_by_participant_2 BOOLEAN DEFAULT false;

-- Index pour performance des filtres
CREATE INDEX IF NOT EXISTS idx_unified_conv_deleted_p1 ON unified_conversations(deleted_by_participant_1) WHERE deleted_by_participant_1 = true;
CREATE INDEX IF NOT EXISTS idx_unified_conv_deleted_p2 ON unified_conversations(deleted_by_participant_2) WHERE deleted_by_participant_2 = true;

-- Mettre à jour la policy RLS pour exclure les conversations supprimées
DROP POLICY IF EXISTS "Users can view their conversations" ON unified_conversations;

CREATE POLICY "Users can view their non-deleted conversations" ON unified_conversations
FOR SELECT USING (
  (auth.uid() = participant_1 AND deleted_by_participant_1 = false) OR 
  (auth.uid() = participant_2 AND deleted_by_participant_2 = false)
);

-- Policy pour permettre la mise à jour des champs deleted_by
DROP POLICY IF EXISTS "Users can update their conversations" ON unified_conversations;

CREATE POLICY "Users can update their conversations" ON unified_conversations
FOR UPDATE USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);