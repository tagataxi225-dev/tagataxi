-- Fix security warning: Set secure search path for existing functions
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_driver_code() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.handle_profile_deletion() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_referral_code() SECURITY DEFINER SET search_path = '';