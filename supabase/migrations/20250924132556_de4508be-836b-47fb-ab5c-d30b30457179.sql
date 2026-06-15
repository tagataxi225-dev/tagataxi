-- Mettre à jour l'email du super admin
UPDATE public.admins 
SET email = 'support@icon-sarl.com',
    updated_at = now()
WHERE user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335'
  AND email = 'support@kwendataxi.com';

-- Log de la mise à jour
INSERT INTO public.admin_notifications (
    title, message, type, severity, data
) VALUES (
    'Super Admin Email Updated',
    'L''email du super admin a été mis à jour vers support@icon-sarl.com',
    'admin_update',
    'info',
    jsonb_build_object(
        'operation', 'email_update',
        'timestamp', now(),
        'user_id', 'f15340e1-6c68-4306-b13a-e0c372b1b335',
        'new_email', 'support@icon-sarl.com'
    )
);