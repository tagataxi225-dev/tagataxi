import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserActivity {
  id: string;
  activity_type: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  metadata: any;
  created_at: string;
}

export const useUserActivity = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async (limit: number = 50) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (
    activityType: string,
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          description,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata || {},
          ip_address: null, // Sera rempli côté serveur si nécessaire
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      // Optionnellement, rafraîchir la liste des activités
      // fetchActivities();
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    }
  };

  const getActivitiesByType = (type: string) => {
    return activities.filter(activity => activity.activity_type === type);
  };

  const getActivitiesByDateRange = (startDate: Date, endDate: Date) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= startDate && activityDate <= endDate;
    });
  };

  const getRecentActivities = (hours: number = 24) => {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return activities.filter(activity => new Date(activity.created_at) >= cutoffDate);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'profile_update': return '👤';
      case 'order_created': return '📦';
      case 'order_completed': return '✅';
      case 'payment': return '💳';
      case 'transport_booking': return '🚗';
      case 'delivery_order': return '🚚';
      case 'marketplace_order': return '🛒';
      case 'promo_code_used': return '🏷️';
      case 'referral_used': return '👥';
      case 'support_ticket': return '🎫';
      case 'address_saved': return '📍';
      case 'settings_updated': return '⚙️';
      default: return '📝';
    }
  };

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'login': return 'Connexion';
      case 'logout': return 'Déconnexion';
      case 'profile_update': return 'Mise à jour du profil';
      case 'order_created': return 'Commande créée';
      case 'order_completed': return 'Commande terminée';
      case 'payment': return 'Paiement';
      case 'transport_booking': return 'Réservation transport';
      case 'delivery_order': return 'Commande livraison';
      case 'marketplace_order': return 'Commande marketplace';
      case 'promo_code_used': return 'Code promo utilisé';
      case 'referral_used': return 'Parrainage utilisé';
      case 'support_ticket': return 'Ticket support';
      case 'address_saved': return 'Adresse sauvegardée';
      case 'settings_updated': return 'Paramètres mis à jour';
      default: return activityType;
    }
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return {
    activities,
    logActivity,
    getActivitiesByType,
    getActivitiesByDateRange,
    getRecentActivities,
    getActivityIcon,
    getActivityTypeLabel,
    formatActivityDate,
    isLoading,
    refetch: fetchActivities,
  };
};