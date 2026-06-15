import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  data?: any;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: string;
}

export const useNotificationActions = () => {
  const navigate = useNavigate();

  const executeAction = useCallback(async (action: NotificationAction, notificationId?: string) => {
    try {
      switch (action.action) {
        case 'navigate':
          navigate(action.data.path);
          break;

        case 'accept_ride':
          await supabase
            .from('transport_bookings')
            .update({ status: 'accepted' })
            .eq('id', action.data.bookingId);
          
          toast({
            title: "Course acceptée",
            description: "Vous avez accepté la course",
          });
          break;

        case 'reject_ride':
          await supabase
            .from('transport_bookings')
            .update({ status: 'rejected' })
            .eq('id', action.data.bookingId);
          
          toast({
            title: "Course refusée",
            description: "Vous avez refusé la course",
          });
          break;

        case 'confirm_delivery':
          await supabase
            .from('delivery_orders')
            .update({ status: 'confirmed' })
            .eq('id', action.data.deliveryId);
          
          toast({
            title: "Livraison confirmée",
            description: "La livraison a été confirmée",
          });
          break;

        case 'mark_delivered':
          await supabase
            .from('delivery_orders')
            .update({ 
              status: 'delivered',
              delivery_time: new Date().toISOString()
            })
            .eq('id', action.data.deliveryId);
          
          toast({
            title: "Livraison terminée",
            description: "La livraison a été marquée comme terminée",
          });
          break;

        case 'reply_message':
          navigate(`/chat/${action.data.conversationId}`);
          break;

        case 'view_support_ticket':
          navigate(`/support/tickets/${action.data.ticketId}`);
          break;

        case 'topup_credits':
          navigate('/driver/wallet');
          break;

        case 'claim_reward':
          await supabase.functions.invoke('claim-challenge-reward', {
            body: { challengeId: action.data.challengeId }
          });
          
          toast({
            title: "Récompense réclamée",
            description: "Votre récompense a été ajoutée à votre portefeuille",
          });
          break;

        case 'open_external':
          window.open(action.data.url, '_blank');
          break;

        case 'dismiss':
          // Just dismiss the notification
          break;

        default:
          console.warn('Unknown notification action:', action.action);
      }

      // Mark notification as read if ID provided
      if (notificationId) {
        await supabase
          .from('user_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId);
      }

    } catch (error: any) {
      console.error('Error executing notification action:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
        variant: "destructive"
      });
    }
  }, [navigate]);

  const getActionsForNotification = useCallback((type: string, metadata?: any): NotificationAction[] => {
    const actions: NotificationAction[] = [];

    switch (type) {
      case 'ride_request':
        actions.push(
          {
            id: 'accept',
            label: 'Accepter',
            action: 'accept_ride',
            data: { bookingId: metadata?.bookingId },
            variant: 'default'
          },
          {
            id: 'reject',
            label: 'Refuser',
            action: 'reject_ride',
            data: { bookingId: metadata?.bookingId },
            variant: 'destructive'
          }
        );
        break;

      case 'delivery_request':
        actions.push(
          {
            id: 'confirm',
            label: 'Confirmer',
            action: 'confirm_delivery',
            data: { deliveryId: metadata?.deliveryId },
            variant: 'default'
          },
          {
            id: 'view',
            label: 'Voir détails',
            action: 'navigate',
            data: { path: `/delivery/${metadata?.deliveryId}` },
            variant: 'outline'
          }
        );
        break;

      case 'chat_message':
        actions.push(
          {
            id: 'reply',
            label: 'Répondre',
            action: 'reply_message',
            data: { conversationId: metadata?.conversationId },
            variant: 'default'
          }
        );
        break;

      case 'support_ticket':
        actions.push(
          {
            id: 'view_ticket',
            label: 'Voir ticket',
            action: 'view_support_ticket',
            data: { ticketId: metadata?.ticketId },
            variant: 'default'
          }
        );
        break;

      case 'credit_low':
        actions.push(
          {
            id: 'topup',
            label: 'Recharger',
            action: 'topup_credits',
            data: {},
            variant: 'default'
          }
        );
        break;

      case 'challenge_completed':
        actions.push(
          {
            id: 'claim',
            label: 'Réclamer',
            action: 'claim_reward',
            data: { challengeId: metadata?.challengeId },
            variant: 'default'
          }
        );
        break;

      default:
        // Default action for all notifications
        if (metadata?.path) {
          actions.push({
            id: 'view',
            label: 'Voir détails',
            action: 'navigate',
            data: { path: metadata.path },
            variant: 'outline'
          });
        }
    }

    // Always add dismiss action
    actions.push({
      id: 'dismiss',
      label: 'Fermer',
      action: 'dismiss',
      data: {},
      variant: 'secondary'
    });

    return actions;
  }, []);

  return {
    executeAction,
    getActionsForNotification
  };
};