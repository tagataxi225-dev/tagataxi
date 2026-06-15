-- Rendre draw_id et entry_id nullables pour les cartes à gratter quotidiennes
-- Ces cartes ne font pas partie d'un tirage spécifique

ALTER TABLE public.lottery_wins 
  ALTER COLUMN draw_id DROP NOT NULL,
  ALTER COLUMN entry_id DROP NOT NULL;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN public.lottery_wins.draw_id IS 'ID du tirage (null pour les cartes quotidiennes Kwenda Gratta)';
COMMENT ON COLUMN public.lottery_wins.entry_id IS 'ID de l entrée (null pour les cartes quotidiennes)';