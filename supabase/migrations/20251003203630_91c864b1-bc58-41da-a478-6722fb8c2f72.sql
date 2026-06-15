-- Créer un index composé pour optimiser la vérification admin
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_check 
ON user_roles(user_id, role, is_active) 
WHERE role = 'admin' AND is_active = true;