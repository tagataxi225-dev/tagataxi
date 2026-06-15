import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface SupportTicket {
  id: string;
  ticket_number?: string;
  subject: string;
  description: string;
  category_id?: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  support_categories?: SupportCategory;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  attachments?: any;
  is_internal: boolean;
  created_at: string;
}

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des tickets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos tickets de support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (ticketData: {
    subject: string;
    description: string;
    category_id: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    attachments?: any[];
  }) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticketData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      
      toast({
        title: "Ticket créé",
        description: `Votre ticket a été créé. Nous vous répondrons bientôt.`,
      });

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la création du ticket:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket de support.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string): Promise<SupportMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  };

  const sendMessage = async (ticketId: string, message: string, attachments?: any[]) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: 'user',
          message,
          attachments: attachments || [],
          is_internal: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été ajouté au ticket.",
      });

      return data;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getOpenTicketsCount = () => {
    return tickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress').length;
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'in_progress': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return {
    tickets,
    categories,
    createTicket,
    fetchTicketMessages,
    sendMessage,
    getTicketsByStatus,
    getOpenTicketsCount,
    getTicketStatusColor,
    getPriorityColor,
    isLoading,
    refetch: fetchTickets,
  };
};