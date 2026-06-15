-- Final Security Definer Views Fix - Simplified
-- Clean up any remaining SECURITY DEFINER views without complex logging

-- 1. Drop any remaining SECURITY DEFINER views
DO $$ 
DECLARE
    view_record RECORD;
    views_dropped INTEGER := 0;
BEGIN
    -- Check for any views with SECURITY DEFINER in definition
    FOR view_record IN 
        SELECT schemaname, viewname
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
        views_dropped := views_dropped + 1;
        RAISE NOTICE 'Dropped SECURITY DEFINER view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
    
    RAISE NOTICE 'Security cleanup completed: % SECURITY DEFINER views processed', views_dropped;
END $$;

-- 2. Create monitoring function for future security checks
CREATE OR REPLACE FUNCTION public.security_definer_check()
RETURNS TABLE(
    check_name text, 
    status text, 
    view_count integer,
    recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    dangerous_views INTEGER;
BEGIN
    -- Count any SECURITY DEFINER views in public schema
    SELECT COUNT(*) INTO dangerous_views
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%';
    
    RETURN QUERY VALUES (
        'SECURITY DEFINER Views'::text,
        CASE WHEN dangerous_views = 0 THEN 'SECURED' ELSE 'ALERT' END::text,
        dangerous_views,
        CASE WHEN dangerous_views = 0 
             THEN 'No dangerous SECURITY DEFINER views found' 
             ELSE 'SECURITY DEFINER views detected - immediate action required' 
        END::text
    );
END;
$$;