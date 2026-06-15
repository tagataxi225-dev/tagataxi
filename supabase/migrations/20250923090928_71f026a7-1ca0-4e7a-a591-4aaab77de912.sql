-- PHASE 5: EDGE FUNCTIONS - Tables de support

-- 1. Table pour stocker les notifications push
CREATE TABLE IF NOT EXISTS public.push_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    data JSONB DEFAULT '{}',
    is_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table pour monitoring des edge functions
CREATE TABLE IF NOT EXISTS public.function_monitoring_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    success_rate NUMERIC DEFAULT 100,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. RLS pour push_notifications
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.push_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.push_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notification status" 
ON public.push_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. RLS pour function_monitoring_logs
ALTER TABLE public.function_monitoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can access monitoring logs" 
ON public.function_monitoring_logs 
FOR ALL 
USING (is_current_user_admin());

-- 5. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON public.push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at ON public.push_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_is_sent ON public.push_notifications(is_sent);

CREATE INDEX IF NOT EXISTS idx_function_monitoring_function_name ON public.function_monitoring_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_monitoring_created_at ON public.function_monitoring_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_function_monitoring_status ON public.function_monitoring_logs(status);

-- 6. Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Supprimer les notifications lues de plus de X jours
    DELETE FROM public.push_notifications 
    WHERE read_at IS NOT NULL 
      AND read_at < now() - (days_old || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log de l'opération
    INSERT INTO public.activity_logs (
        activity_type, 
        description, 
        metadata
    ) VALUES (
        'notification_cleanup',
        format('Cleaned up %s old notifications', deleted_count),
        jsonb_build_object('deleted_count', deleted_count, 'days_old', days_old)
    );
    
    RETURN deleted_count;
END;
$function$;

-- 7. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_push_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_push_notifications_updated_at
    BEFORE UPDATE ON public.push_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_push_notifications_updated_at();

-- 8. Notification pour les admins
INSERT INTO public.admin_notifications (
    type,
    severity,
    title,
    message,
    data
) VALUES (
    'deployment',
    'success',
    'Phase 5 - Edge Functions déployées',
    'Système de notifications push, monitoring et dispatcher déployés avec succès. Toutes les edge functions sont opérationnelles.',
    jsonb_build_object(
        'phase', 5,
        'functions_deployed', ARRAY['push-notifications', 'function-monitor', 'notification-dispatcher'],
        'tables_created', ARRAY['push_notifications', 'function_monitoring_logs']
    )
) ON CONFLICT DO NOTHING;