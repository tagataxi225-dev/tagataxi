import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone,
  Star,
  Gift,
  Bell
} from 'lucide-react';

interface DeliveryNotification {
  id: string;
  type: 'status_update' | 'location_update' | 'rating_request' | 'bonus_earned' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface EnhancedDeliveryNotificationsProps {
  orderId?: string;
  userType: 'client' | 'driver';
}

// Traductions multilingues Congo
const translations = {
  status_updates: {
    'confirmed': {
      fr: 'Commande confirmée',
      ln: 'Commande e ndimaka', // Lingala
      kg: 'Commande yakana', // Kikongo
      sw: 'Agizo limethibitishwa' // Kiswahili
    },
    'driver_assigned': {
      fr: 'Livreur assigné',
      ln: 'Motambi apesami',
      kg: 'Ntumi a mfunika',
      sw: 'Mwongozi ameteulewa'
    },
    'picked_up': {
      fr: 'Colis récupéré',
      ln: 'Biloko ebimi',
      kg: 'Biloko bizuali',
      sw: 'Vitu vimechukuliwa'
    },
    'in_transit': {
      fr: 'En cours de livraison',
      ln: 'Ezali na nzela',
      kg: 'Keti mu nzila',
      sw: 'Inasafirishwa'
    },
    'delivered': {
      fr: 'Livré avec succès',
      ln: 'Epesami malamu',
      kg: 'Tatu va mpila malamu',
      sw: 'Kimesafirishwa'
    }
  },
  messages: {
    welcome: {
      fr: 'Bienvenue sur TAGA Taxi!',
      ln: 'Boyei malamu na TAGA Taxi!',
      kg: 'Tuete ku TAGA Taxi!',
      sw: 'Karibu TAGA Taxi!'
    },
    excellent_service: {
      fr: 'Service excellent!',
      ln: 'Mosala malamu mpenza!',
      kg: 'Kisalu kitoko!',
      sw: 'Huduma bora!'
    }
  }
};

const notificationIcons = {
  status_update: Package,
  location_update: MapPin,
  rating_request: Star,
  bonus_earned: Gift,
  system_alert: Bell
};

const priorityColors = {
  low: 'blue',
  medium: 'amber',
  high: 'orange',
  urgent: 'red'
};

export const EnhancedDeliveryNotifications: React.FC<EnhancedDeliveryNotificationsProps> = ({
  orderId,
  userType
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [language, setLanguage] = useState<'fr' | 'ln' | 'kg' | 'sw'>('fr');

  // Détecter la langue préférée depuis le profil utilisateur
  useEffect(() => {
    const detectLanguage = async () => {
      if (!user) return;
      
      try {
        // Utiliser le français par défaut
        setLanguage('fr');
      } catch (error) {
        console.error('Erreur détection langue:', error);
      }
    };

    detectLanguage();
  }, [user]);

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (!user) return;

    const notificationChannel = supabase
      .channel('delivery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_orders',
          filter: userType === 'client' ? 
            `user_id=eq.${user.id}` : 
            `driver_id=eq.${user.id}`
        },
        (payload) => {
          handleDeliveryUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: userType === 'client' ? 
            `user_id=eq.${user.id}` : 
            `driver_id=eq.${user.id}`
        },
        (payload) => {
          handleDeliveryUpdate(payload.new);
        }
      )
      .subscribe();

    // Canal pour les mises à jour de position
    const locationChannel = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations'
        },
        (payload) => {
          if (userType === 'client') {
            handleLocationUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(locationChannel);
    };
  }, [user, userType]);

  const handleDeliveryUpdate = (delivery: any) => {
    const statusTranslation = translations.status_updates[delivery.status as keyof typeof translations.status_updates];
    const title = statusTranslation ? statusTranslation[language] : delivery.status;
    
    let message = '';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    
    if (userType === 'client') {
      switch (delivery.status) {
        case 'confirmed':
          message = 'Votre commande a été confirmée et sera bientôt prise en charge.';
          priority = 'high';
          break;
        case 'driver_assigned':
          message = 'Un livreur a été assigné à votre commande.';
          priority = 'high';
          break;
        case 'picked_up':
          message = 'Votre colis a été récupéré et est en route.';
          priority = 'high';
          break;
        case 'in_transit':
          message = 'Votre colis est en cours de livraison.';
          priority = 'medium';
          break;
        case 'delivered':
          message = 'Votre colis a été livré avec succès!';
          priority = 'urgent';
          break;
      }
    } else {
      switch (delivery.status) {
        case 'driver_assigned':
          message = 'Nouvelle livraison assignée. Vérifiez les détails.';
          priority = 'urgent';
          break;
        case 'delivered':
          message = 'Livraison terminée! Excellent travail.';
          priority = 'high';
          break;
      }
    }

    const notification: DeliveryNotification = {
      id: `${delivery.id}-${delivery.status}-${Date.now()}`,
      type: 'status_update',
      title,
      message,
      data: delivery,
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };

    addNotification(notification);
    showToastNotification(notification);
  };

  const handleLocationUpdate = (location: any) => {
    if (userType !== 'client') return;

    const notification: DeliveryNotification = {
      id: `location-${location.driver_id}-${Date.now()}`,
      type: 'location_update',
      title: 'Position mise à jour',
      message: 'Votre livreur se rapproche de la destination.',
      data: location,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'low'
    };

    addNotification(notification);
  };

  const addNotification = (notification: DeliveryNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Garder max 10 notifications
  };

  const showToastNotification = (notification: DeliveryNotification) => {
    const Icon = notificationIcons[notification.type];
    const colorClass = priorityColors[notification.priority];

    // Toast avec couleurs Congo
    if (notification.priority === 'urgent') {
      toast.success(notification.title, {
        description: notification.message,
        duration: 6000,
        action: {
          label: 'Voir',
          onClick: () => handleNotificationClick(notification)
        }
      });
    } else if (notification.priority === 'high') {
      toast.info(notification.title, {
        description: notification.message,
        duration: 4000
      });
    } else {
      toast(notification.title, {
        description: notification.message,
        duration: 3000
      });
    }

    // Vibration pour mobile
    if ('vibrate' in navigator && notification.priority === 'urgent') {
      navigator.vibrate([200, 100, 200]);
    }

    // Son de notification (si supporté)
    if (notification.priority === 'urgent') {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAABAC44AQA8JwEAAgAQAGRhdGE=');
        audio.play().catch(() => {}); // Ignore les erreurs de lecture audio
      } catch (error) {
        // Ignore les erreurs audio
      }
    }
  };

  const handleNotificationClick = (notification: DeliveryNotification) => {
    // Marquer comme lu
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Actions spécifiques selon le type
    switch (notification.type) {
      case 'status_update':
        if (notification.data?.status === 'delivered' && userType === 'client') {
          // Proposer d'évaluer le service
          toast.info('Évaluez votre livraison', {
            description: 'Aidez-nous à améliorer notre service',
            action: {
              label: 'Évaluer',
              onClick: () => openRatingDialog(notification.data)
            }
          });
        }
        break;
      case 'rating_request':
        openRatingDialog(notification.data);
        break;
    }
  };

  const openRatingDialog = (deliveryData: any) => {
    // TODO: Ouvrir modal d'évaluation
    console.log('Ouvrir évaluation:', deliveryData);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Génération de bonus/récompenses pour les livreurs
  useEffect(() => {
    if (userType === 'driver' && user) {
      const checkForBonuses = async () => {
        try {
          // Vérifier les livraisons complétées aujourd'hui
          const today = new Date().toISOString().split('T')[0];
          const { data: todayDeliveries } = await supabase
            .from('delivery_orders')
            .select('id')
            .eq('driver_id', user.id)
            .eq('status', 'delivered')
            .gte('delivered_at', `${today}T00:00:00`)
            .lte('delivered_at', `${today}T23:59:59`);

          if (todayDeliveries && todayDeliveries.length > 0) {
            const count = todayDeliveries.length;
            
            // Bonus pour multiples livraisons
            if (count === 5) {
              const bonusNotification: DeliveryNotification = {
                id: `bonus-5-${Date.now()}`,
                type: 'bonus_earned',
                title: '🎉 Bonus 5 livraisons!',
                message: 'Vous avez reçu 2000 FC de bonus pour 5 livraisons aujourd\'hui!',
                timestamp: new Date().toISOString(),
                read: false,
                priority: 'high'
              };
              addNotification(bonusNotification);
              showToastNotification(bonusNotification);
            } else if (count === 10) {
              const bonusNotification: DeliveryNotification = {
                id: `bonus-10-${Date.now()}`,
                type: 'bonus_earned',
                title: '🏆 Super bonus!',
                message: 'Incroyable! 5000 FC de bonus pour 10 livraisons!',
                timestamp: new Date().toISOString(),
                read: false,
                priority: 'urgent'
              };
              addNotification(bonusNotification);
              showToastNotification(bonusNotification);
            }
          }
        } catch (error) {
          console.error('Erreur vérification bonus:', error);
        }
      };

      // Vérifier les bonus toutes les heures
      const bonusInterval = setInterval(checkForBonuses, 3600000);
      checkForBonuses(); // Vérification immédiate

      return () => clearInterval(bonusInterval);
    }
  }, [userType, user]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => {
          const Icon = notificationIcons[notification.type];
          const colorClass = priorityColors[notification.priority];
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 400, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.9 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className={`
                bg-card border border-border rounded-lg shadow-lg p-4 cursor-pointer
                hover:shadow-xl transition-all duration-200
                ${!notification.read ? 'ring-2 ring-primary/20' : ''}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full bg-${colorClass}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${colorClass}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedDeliveryNotifications;