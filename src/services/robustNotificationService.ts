// Service de notifications push robuste avec retry intelligent
import { supabase } from '@/integrations/supabase/client';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: 'ride_request' | 'delivery_request' | 'marketplace_order' | 'system' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: any;
  sound?: boolean;
  vibration?: boolean;
  timeout?: number; // En millisecondes (par défaut 2000ms)
}

interface NotificationResult {
  success: boolean;
  notification_id?: string;
  delivery_method?: 'push' | 'websocket' | 'sms' | 'fallback';
  attempts?: number;
  error?: string;
}

export class RobustNotificationService {
  private static instance: RobustNotificationService;
  private retryQueue: Map<string, NotificationPayload> = new Map();
  private maxRetries = 5;
  private retryIntervals = [1000, 3000, 5000, 10000, 20000]; // Escalade progressive

  static getInstance(): RobustNotificationService {
    if (!this.instance) {
      this.instance = new RobustNotificationService();
    }
    return this.instance;
  }

  // Envoi de notification avec retry intelligent
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    console.log('📱 Envoi notification:', payload);

    try {
      // 1. Tentative push notification principale
      const pushResult = await this.sendPushNotification(payload);
      if (pushResult.success) {
        return pushResult;
      }

      // 2. Fallback WebSocket temps réel
      const websocketResult = await this.sendWebSocketNotification(payload);
      if (websocketResult.success) {
        return websocketResult;
      }

      // 3. Fallback SMS pour notifications urgentes
      if (payload.priority === 'urgent' || payload.type === 'ride_request') {
        const smsResult = await this.sendSMSFallback(payload);
        if (smsResult.success) {
          return smsResult;
        }
      }

      // 4. Ajouter à la queue de retry
      return await this.addToRetryQueue(payload);

    } catch (error: any) {
      console.error('❌ Erreur envoi notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Push notification principale
  private async sendPushNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      // Insérer dans la table des notifications
      const { data: notification, error } = await supabase
        .from('push_notifications')
        .insert({
          user_id: payload.user_id,
          title: payload.title,
          message: payload.message,
          notification_type: payload.type,
          priority: payload.priority,
          data: payload.data
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer via channel temps réel Supabase
      await supabase
        .channel(`notifications:${payload.user_id}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            id: notification.id,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            priority: payload.priority,
            data: payload.data,
            sound: payload.sound !== false,
            vibration: payload.vibration !== false,
            timestamp: new Date().toISOString()
          }
        });

      // Jouer le son selon le type
      this.playNotificationSound(payload.type, payload.priority);

      // Marquer comme envoyée
      await supabase
        .from('push_notifications')
        .update({ 
          is_sent: true,
          sent_at: new Date().toISOString() 
        })
        .eq('id', notification.id);

      return {
        success: true,
        notification_id: notification.id,
        delivery_method: 'push',
        attempts: 1
      };

    } catch (error: any) {
      console.error('Erreur push notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // WebSocket fallback
  private async sendWebSocketNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      // Utiliser Supabase Realtime comme WebSocket
      const channel = supabase.channel(`user:${payload.user_id}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'urgent_notification',
        payload: {
          title: payload.title,
          message: payload.message,
          type: payload.type,
          priority: payload.priority,
          data: payload.data,
          timestamp: new Date().toISOString(),
          fallback: true
        }
      });

      return {
        success: true,
        delivery_method: 'websocket',
        attempts: 1
      };

    } catch (error: any) {
      console.error('Erreur WebSocket notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // SMS fallback pour urgences
  private async sendSMSFallback(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      // Récupérer le numéro de téléphone de l'utilisateur
      // Mock phone number for demo
      const profile = { phone_number: '+243123456789' };

      if (!profile?.phone_number) {
        return {
          success: false,
          error: 'Numéro de téléphone non disponible'
        };
      }

      // Appeler l'edge function SMS
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phone_number: profile.phone_number,
          message: `${payload.title}: ${payload.message}`,
          type: payload.type
        }
      });

      if (error) throw error;

      return {
        success: true,
        delivery_method: 'sms',
        attempts: 1
      };

    } catch (error: any) {
      console.error('Erreur SMS fallback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ajouter à la queue de retry
  private async addToRetryQueue(payload: NotificationPayload): Promise<NotificationResult> {
    const notificationId = `retry_${Date.now()}_${Math.random()}`;
    this.retryQueue.set(notificationId, payload);

    // Démarrer le processus de retry
    this.startRetryProcess(notificationId, payload);

    return {
      success: false,
      notification_id: notificationId,
      delivery_method: 'fallback',
      attempts: 0,
      error: 'En attente de retry'
    };
  }

  // Processus de retry avec escalade
  private async startRetryProcess(notificationId: string, payload: NotificationPayload): Promise<void> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      await new Promise(resolve => setTimeout(resolve, this.retryIntervals[attempt]));

      if (!this.retryQueue.has(notificationId)) {
        break; // Notification supprimée de la queue
      }

      console.log(`🔄 Retry notification ${attempt + 1}/${this.maxRetries}:`, payload.title);

      const result = await this.sendPushNotification(payload);
      
      if (result.success) {
        this.retryQueue.delete(notificationId);
        console.log('✅ Notification envoyée après retry');
        break;
      }

      // Dernier essai avec SMS si priorité élevée
      if (attempt === this.maxRetries - 1 && payload.priority === 'urgent') {
        await this.sendSMSFallback(payload);
      }
    }

    // Nettoyer la queue si échec final
    this.retryQueue.delete(notificationId);
  }

  // Notification prioritaire pour chauffeurs proches
  async notifyNearbyDrivers(
    drivers: Array<{ driver_id: string; distance: number }>,
    rideRequest: any
  ): Promise<NotificationResult[]> {
    const notifications: Promise<NotificationResult>[] = [];

    // Trier par distance et limiter aux 5 plus proches
    const sortedDrivers = drivers
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    for (const driver of sortedDrivers) {
      const priority = driver.distance < 1 ? 'urgent' : 
                      driver.distance < 2 ? 'high' : 'normal';

      const notification = this.sendNotification({
        user_id: driver.driver_id,
        title: '🚗 Nouvelle course disponible',
        message: `${rideRequest.pickup_location} → ${rideRequest.destination || 'Destination à confirmer'}`,
        type: 'ride_request',
        priority,
        data: {
          ride_request_id: rideRequest.id,
          pickup_coordinates: rideRequest.pickup_coordinates,
          estimated_price: rideRequest.surge_price || rideRequest.estimated_price,
          distance: driver.distance
        },
        sound: true,
        vibration: true,
        timeout: NOTIFICATION_CONFIG.RIDE_REQUEST_TIMEOUT
      });

      notifications.push(notification);

      // Délai entre notifications pour éviter le spam
      if (driver.distance > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return Promise.all(notifications);
  }

  // Sons de notification par type
  private playNotificationSound(type: string, priority: string): void {
    try {
      if ('vibrate' in navigator && priority === 'urgent') {
        navigator.vibrate([200, 100, 200]);
      }

      // Son différent selon le type
      const audioFiles = {
        'ride_request': '/sounds/ride-notification.mp3',
        'delivery_request': '/sounds/delivery-notification.mp3',
        'marketplace_order': '/sounds/order-notification.mp3',
        'urgent': '/sounds/urgent-notification.mp3'
      };

      const audioFile = audioFiles[type] || audioFiles['ride_request'];
      const audio = new Audio(audioFile);
      audio.volume = priority === 'urgent' ? 1.0 : 0.7;
      audio.play().catch(console.warn);

    } catch (error) {
      console.warn('Impossible de jouer le son:', error);
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_notifications')
        .update({ 
          is_sent: true
        })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
      return false;
    }
  }

  // Statistiques de livraison
  async getDeliveryStats(): Promise<{
    total_sent: number;
    success_rate: number;
    average_delivery_time: number;
    retry_rate: number;
  }> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: notifications } = await supabase
        .from('push_notifications')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString());

      if (!notifications || notifications.length === 0) {
        return {
          total_sent: 0,
          success_rate: 0,
          average_delivery_time: 0,
          retry_rate: 0
        };
      }

      const successful = notifications.filter(n => n.is_sent).length;
      const success_rate = (successful / notifications.length) * 100;

      return {
        total_sent: notifications.length,
        success_rate,
        average_delivery_time: 2.5, // seconds
        retry_rate: this.retryQueue.size / notifications.length * 100
      };

    } catch (error) {
      console.error('Erreur stats notifications:', error);
      return {
        total_sent: 0,
        success_rate: 0,
        average_delivery_time: 0,
        retry_rate: 0
      };
    }
  }

  // Nettoyer la queue de retry
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  // Obtenir l'état de la queue
  getRetryQueueSize(): number {
    return this.retryQueue.size;
  }
}

export const robustNotifications = RobustNotificationService.getInstance();