-- Corriger la fonction generate_lottery_ticket_number pour éviter l'ambiguïté
DROP FUNCTION IF EXISTS public.generate_lottery_ticket_number();

CREATE OR REPLACE FUNCTION public.generate_lottery_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_ticket_number TEXT;
  exists_check INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Générer un code de 10 caractères (format: KWND-XXXXXX)
    new_ticket_number := 'KWND-';
    FOR i IN 1..6 LOOP
      new_ticket_number := new_ticket_number || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Vérifier si le numéro existe déjà (spécifier explicitement la table)
    SELECT COUNT(*) INTO exists_check 
    FROM public.lottery_tickets 
    WHERE lottery_tickets.ticket_number = new_ticket_number;
    
    -- Si le numéro n'existe pas, sortir de la boucle
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_ticket_number;
END;
$function$;