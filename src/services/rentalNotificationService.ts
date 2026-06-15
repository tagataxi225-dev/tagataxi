/**
 * Service de notifications pour les locations de véhicules
 * Envoie des notifications push et enregistre l'historique
 */

import { supabase } from '@/integrations/supabase/client';
import { robustNotifications } from './robustNotificationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type RentalStatus = 'pending' | 'approved_by_partner' | 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface RentalNotificationData {
  booking_id: string;
  user_id: string;
  vehicle_name: string;
  status: RentalStatus;
  total_amount: number;
  start_date: string;
  end_date: string;
}

interface StatusConfig {
  title: string;
  getMessage: (data: RentalNotificationData) => string;
  emoji: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const statusMessages: Record<RentalStatus, StatusConfig> = {
  pending: {
    title: '📋 Demande de location reçue',
    getMessage: (d) => `Votre demande pour ${d.vehicle_name} est en cours de traitement. Réponse sous peu !`,
    emoji: '📋',
    priority: 'low'
  },
  approved_by_partner: {
    title: '✅ Véhicule disponible !',
    getMessage: (d) => `Bonne nouvelle ! Le ${d.vehicle_name} est disponible du ${d.start_date} au ${d.end_date}. Procédez au paiement de ${d.total_amount.toLocaleString()} CDF pour confirmer !`,
    emoji: '✅',
    priority: 'urgent'
  },
  confirmed: {
    title: '🎉 Location Confirmée & Payée !',
    getMessage: (d) => `Excellente nouvelle ! Votre ${d.vehicle_name} est réservé du ${d.start_date} au ${d.end_date}. Préparez-vous pour l'aventure !`,
    emoji: '🎊',
    priority: 'high'
  },
  rejected: {
    title: '❌ Demande non acceptée',
    getMessage: (d) => `Désolé, votre demande pour ${d.vehicle_name} n'a pas pu être acceptée. Explorez d'autres véhicules !`,
    emoji: '❌',
    priority: 'normal'
  },
  in_progress: {
    title: '🚗 Location démarrée !',
    getMessage: (d) => `C'est parti ! Profitez de votre ${d.vehicle_name}. Bonne route et soyez prudent ! 🛣️`,
    emoji: '🚗',
    priority: 'normal'
  },
  completed: {
    title: '🏁 Location terminée avec succès',
    getMessage: (d) => `Merci d'avoir choisi ${d.vehicle_name} ! Nous espérons vous revoir très bientôt. N'hésitez pas à laisser un avis ! ⭐`,
    emoji: '🎊',
    priority: 'normal'
  },
  cancelled: {
    title: '⚠️ Location annulée',
    getMessage: (d) => `La location de ${d.vehicle_name} a été annulée. Contactez-nous si vous avez des questions.`,
    emoji: '⚠️',
    priority: 'normal'
  },
  no_show: {
    title: '⏰ Absence constatée',
    getMessage: (d) => `Vous n'êtes pas venu récupérer ${d.vehicle_name}. Si c'est une erreur, contactez rapidement le partenaire.`,
    emoji: '⏰',
    priority: 'high'
  }
};

/**
 * Envoie une notification de changement de statut de location
 */
export async function sendRentalStatusNotification(data: RentalNotificationData): Promise<boolean> {
  const config = statusMessages[data.status];
  if (!config) {
    console.warn('❌ Statut de notification inconnu:', data.status);
    return false;
  }

  try {
    console.log('📱 Envoi notification location:', data.status, 'pour user:', data.user_id);

    // 1. Envoyer notification push via robustNotifications
    await robustNotifications.sendNotification({
      user_id: data.user_id,
      title: config.title,
      message: config.getMessage(data),
      type: 'system',
      priority: config.priority,
      data: {
        booking_id: data.booking_id,
        status: data.status,
        vehicle_name: data.vehicle_name,
        total_amount: data.total_amount
      },
      sound: true,
      vibration: data.status === 'confirmed' || data.status === 'no_show'
    });

    // 2. Insérer dans order_notifications pour historique
    try {
      await supabase.from('order_notifications').insert({
        user_id: data.user_id,
        order_id: data.booking_id, // Utiliser booking_id comme order_id
        title: config.title,
        message: config.getMessage(data),
        notification_type: 'rental_status',
        is_read: false,
        metadata: {
          booking_id: data.booking_id,
          status: data.status,
          emoji: config.emoji,
          vehicle_name: data.vehicle_name,
          total_amount: data.total_amount
        }
      });
    } catch (insertError) {
      console.warn('⚠️ Erreur insertion historique notification:', insertError);
    }

    console.log('✅ Notification location envoyée avec succès:', data.status);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi notification location:', error);
    return false;
  }
}

/**
 * Formate les dates pour l'affichage dans les notifications
 */
export function formatDateForNotification(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
}
