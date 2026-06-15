-- Fix: notify_seller_on_moderation_change trigger uses 'message' but it's a generated column (alias for 'content')
-- Update the function to use 'content' instead of 'message'

CREATE OR REPLACE FUNCTION public.notify_seller_on_moderation_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Notification uniquement si le statut de modération change
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    
    -- Si approuvé
    IF NEW.moderation_status = 'approved' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        content,  -- FIXED: was 'message' which is a generated column
        type,
        metadata
      ) VALUES (
        NEW.seller_id,
        '✅ Produit approuvé !',
        'Félicitations ! Votre produit "' || NEW.title || '" a été approuvé et est maintenant visible sur la marketplace.',
        'product_status',
        jsonb_build_object(
          'product_id', NEW.id,
          'status', 'approved'
        )
      );
    
    -- Si rejeté
    ELSIF NEW.moderation_status = 'rejected' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        content,  -- FIXED: was 'message' which is a generated column
        type,
        metadata
      ) VALUES (
        NEW.seller_id,
        '❌ Produit rejeté',
        'Votre produit "' || NEW.title || '" a été rejeté. Raison: ' || COALESCE(NEW.rejection_reason, 'Non spécifiée') || '. Vous pouvez le modifier et le soumettre à nouveau.',
        'product_status',
        jsonb_build_object(
          'product_id', NEW.id,
          'status', 'rejected',
          'rejection_reason', NEW.rejection_reason
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;