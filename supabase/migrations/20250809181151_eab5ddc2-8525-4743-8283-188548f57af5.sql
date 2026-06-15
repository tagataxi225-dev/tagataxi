-- Create RPC function to create support tickets with auto-generated ticket numbers
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_user_id UUID,
  p_subject TEXT,
  p_category TEXT,
  p_description TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  user_id UUID,
  subject TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_ticket_number TEXT;
  new_ticket enhanced_support_tickets%ROWTYPE;
BEGIN
  -- Generate unique ticket number
  new_ticket_number := generate_ticket_number();
  
  -- Insert the ticket
  INSERT INTO public.enhanced_support_tickets (
    user_id,
    ticket_number,
    subject,
    category,
    priority,
    description,
    status,
    metadata
  ) VALUES (
    p_user_id,
    new_ticket_number,
    p_subject,
    p_category,
    p_priority,
    p_description,
    'open',
    p_metadata
  ) RETURNING * INTO new_ticket;
  
  -- Return the created ticket
  RETURN QUERY
  SELECT 
    new_ticket.id,
    new_ticket.ticket_number,
    new_ticket.user_id,
    new_ticket.subject,
    new_ticket.category,
    new_ticket.priority,
    new_ticket.status,
    new_ticket.description,
    new_ticket.metadata,
    new_ticket.created_at,
    new_ticket.updated_at;
END;
$$;