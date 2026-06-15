-- Ajouter la colonne auto_approved à withdrawal_requests
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;