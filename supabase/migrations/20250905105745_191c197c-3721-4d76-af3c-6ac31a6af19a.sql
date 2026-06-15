-- Fix remaining security warnings identified by the linter

-- Fix search_path issues for remaining functions
CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_delivery_assignment_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_merchant_accounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_unified_conversation_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.unified_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Update function that may have security definer view issues
CREATE OR REPLACE FUNCTION public.update_intelligent_places_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
                      setweight(to_tsvector('french', COALESCE(NEW.commune, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.quartier, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.avenue, '')), 'C') ||
                      setweight(to_tsvector('french', COALESCE(array_to_string(NEW.name_alternatives, ' '), '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_places_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := to_tsvector('french', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.name_fr, '') || ' ' ||
    COALESCE(NEW.name_local, '') || ' ' ||
    COALESCE(array_to_string(NEW.search_keywords, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.aliases, ' '), '') || ' ' ||
    COALESCE(NEW.commune, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$;

-- Add comments explaining security measures
COMMENT ON FUNCTION public.update_profiles_timestamp() IS 'Secure timestamp update trigger with proper search_path';
COMMENT ON FUNCTION public.update_delivery_assignment_timestamp() IS 'Secure timestamp update trigger with proper search_path';
COMMENT ON FUNCTION public.update_merchant_accounts_updated_at() IS 'Secure timestamp update trigger with proper search_path';
COMMENT ON FUNCTION public.bump_unified_conversation_last_message_at() IS 'Secure conversation update trigger with proper search_path';
COMMENT ON FUNCTION public.update_intelligent_places_search_vector() IS 'Secure search vector update with proper search_path';
COMMENT ON FUNCTION public.update_places_search_vector() IS 'Secure search vector update with proper search_path';