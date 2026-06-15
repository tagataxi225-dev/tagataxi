import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  type: 'bug' | 'help' | 'feedback' | 'other';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: string;
  lastContact?: Date;
}

export const useSupport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Données simulées pour le moment
  const [metrics] = useState<SupportMetrics>({
    totalTickets: 3,
    openTickets: 1,
    avgResponseTime: '2h',
    lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  const [recentTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      type: 'help',
      subject: 'Problème de paiement',
      description: 'Ma transaction a échoué',
      status: 'resolved',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'feedback',
      subject: 'Suggestion d\'amélioration',
      description: 'L\'app pourrait avoir plus de fonctionnalités',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]);

  const submitTicket = async (ticketData: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) => {
    setLoading(true);
    try {
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Ticket envoyé !",
        description: "Votre demande a été transmise à notre équipe support",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const contactEmergency = () => {
    toast({
      title: "Support d'urgence",
      description: "Numéro Tembea: +243 858 040 400",
    });
  };

  const openFAQ = () => {
    toast({
      title: "FAQ",
      description: "Redirection vers la section FAQ",
    });
  };

  return {
    loading,
    metrics,
    recentTickets,
    submitTicket,
    contactEmergency,
    openFAQ
  };
};