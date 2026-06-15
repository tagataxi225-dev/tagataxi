-- Migration: Ajouter les préférences de notifications modernes
-- Date: 2025-11-22
-- Description: Colonnes pour configurer les toasts visuels, sons, volume, durée, etc.

-- Ajouter les colonnes de préférences de notifications dans user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS notification_toast_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound_volume INTEGER DEFAULT 70 CHECK (notification_sound_volume BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS notification_duration INTEGER DEFAULT 6000 CHECK (notification_duration >= 1000),
ADD COLUMN IF NOT EXISTS notification_position TEXT DEFAULT 'top-center' CHECK (notification_position IN ('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right')),
ADD COLUMN IF NOT EXISTS notification_do_not_disturb BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_dnd_start_time TIME DEFAULT '22:00:00',
ADD COLUMN IF NOT EXISTS notification_dnd_end_time TIME DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS notification_types_enabled JSONB DEFAULT '{
  "transport": true,
  "delivery": true,
  "marketplace": true,
  "lottery": true,
  "wallet": true,
  "chat": true,
  "system": true
}'::jsonb;

-- Commentaires pour documentation
COMMENT ON COLUMN user_preferences.notification_toast_enabled IS 'Active/désactive les toasts visuels modernes';
COMMENT ON COLUMN user_preferences.notification_sound_enabled IS 'Active/désactive les sons de notification';
COMMENT ON COLUMN user_preferences.notification_sound_volume IS 'Volume des notifications (0-100)';
COMMENT ON COLUMN user_preferences.notification_duration IS 'Durée d''affichage des toasts en millisecondes';
COMMENT ON COLUMN user_preferences.notification_position IS 'Position des toasts sur l''écran';
COMMENT ON COLUMN user_preferences.notification_do_not_disturb IS 'Mode Ne pas déranger activé/désactivé';
COMMENT ON COLUMN user_preferences.notification_dnd_start_time IS 'Heure de début du mode Ne pas déranger';
COMMENT ON COLUMN user_preferences.notification_dnd_end_time IS 'Heure de fin du mode Ne pas déranger';
COMMENT ON COLUMN user_preferences.notification_types_enabled IS 'Filtres par type de service (JSON)';

-- Mettre à jour les préférences existantes avec les valeurs par défaut
UPDATE user_preferences
SET 
  notification_toast_enabled = COALESCE(notification_toast_enabled, true),
  notification_sound_enabled = COALESCE(notification_sound_enabled, true),
  notification_sound_volume = COALESCE(notification_sound_volume, 70),
  notification_duration = COALESCE(notification_duration, 6000),
  notification_position = COALESCE(notification_position, 'top-center'),
  notification_do_not_disturb = COALESCE(notification_do_not_disturb, false),
  notification_types_enabled = COALESCE(
    notification_types_enabled, 
    '{
      "transport": true,
      "delivery": true,
      "marketplace": true,
      "lottery": true,
      "wallet": true,
      "chat": true,
      "system": true
    }'::jsonb
  )
WHERE notification_toast_enabled IS NULL;