/**
 * Service de Notifications Unifié
 * Centralise tous les aspects des notifications : sons, vibrations, push, toasts
 */

import { soundGenerator, NotificationSoundType } from '@/utils/soundGenerator';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType as HapticsType } from '@capacitor/haptics';
import { toast } from 'sonner';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory = 
  | 'transport'
  | 'delivery' 
  | 'marketplace'
  | 'rental'
  | 'food'
  | 'lottery'
  | 'chat'
  | 'payment'
  | 'system';

export interface UnifiedNotificationOptions {
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  icon?: string;
  action?: {
    label: string;
    url: string;
  };
  sound?: boolean;
  vibrate?: boolean;
  toast?: boolean;
  persist?: boolean;
  data?: Record<string, any>;
}

// Mapping catégorie → type de son
const CATEGORY_SOUND_MAP: Record<NotificationCategory, NotificationSoundType> = {
  transport: 'transport',
  delivery: 'delivery',
  marketplace: 'marketplace',
  rental: 'rental',
  food: 'delivery',
  lottery: 'lottery',
  chat: 'chat',
  payment: 'payment',
  system: 'success'
};

// Mapping priorité → style de vibration
const PRIORITY_HAPTIC_MAP: Record<NotificationPriority, ImpactStyle> = {
  low: ImpactStyle.Light,
  normal: ImpactStyle.Medium,
  high: ImpactStyle.Heavy,
  urgent: ImpactStyle.Heavy
};

class UnifiedNotificationService {
  private soundEnabled = true;
  private vibrationEnabled = true;
  private toastEnabled = true;
  private volume = 0.7;
  private silentHoursStart: number | null = null;
  private silentHoursEnd: number | null = null;

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    try {
      const prefs = localStorage.getItem('notification_preferences');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        this.soundEnabled = parsed.soundEnabled ?? true;
        this.vibrationEnabled = parsed.vibrationEnabled ?? true;
        this.toastEnabled = parsed.toastEnabled ?? true;
        this.volume = parsed.volume ?? 0.7;
        this.silentHoursStart = parsed.silentHoursStart ?? null;
        this.silentHoursEnd = parsed.silentHoursEnd ?? null;
      }
    } catch {
      // Use defaults
    }
  }

  savePreferences(prefs: Partial<{
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    toastEnabled: boolean;
    volume: number;
    silentHoursStart: number | null;
    silentHoursEnd: number | null;
  }>): void {
    Object.assign(this, prefs);
    soundGenerator.setVolume(this.volume);
    soundGenerator.setEnabled(this.soundEnabled);
    
    localStorage.setItem('notification_preferences', JSON.stringify({
      soundEnabled: this.soundEnabled,
      vibrationEnabled: this.vibrationEnabled,
      toastEnabled: this.toastEnabled,
      volume: this.volume,
      silentHoursStart: this.silentHoursStart,
      silentHoursEnd: this.silentHoursEnd
    }));
  }

  private isInSilentHours(): boolean {
    if (this.silentHoursStart === null || this.silentHoursEnd === null) {
      return false;
    }
    
    const now = new Date().getHours();
    if (this.silentHoursStart < this.silentHoursEnd) {
      return now >= this.silentHoursStart && now < this.silentHoursEnd;
    } else {
      // Gère le cas où les heures silencieuses traversent minuit
      return now >= this.silentHoursStart || now < this.silentHoursEnd;
    }
  }

  /**
   * Jouer un son de notification
   */
  async playSound(category: NotificationCategory): Promise<void> {
    if (!this.soundEnabled || this.isInSilentHours()) return;
    
    const soundType = CATEGORY_SOUND_MAP[category];
    await soundGenerator.playSound(soundType);
  }

  /**
   * Déclencher une vibration haptique
   */
  async vibrate(priority: NotificationPriority = 'normal'): Promise<void> {
    if (!this.vibrationEnabled || this.isInSilentHours()) return;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: PRIORITY_HAPTIC_MAP[priority] });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    } else if ('vibrate' in navigator) {
      // Fallback navigateur
      const patterns: Record<NotificationPriority, number[]> = {
        low: [50],
        normal: [100],
        high: [100, 50, 100],
        urgent: [200, 100, 200, 100, 200]
      };
      navigator.vibrate(patterns[priority]);
    }
  }

  /**
   * Afficher un toast notification
   */
  showToast(options: UnifiedNotificationOptions): void {
    if (!this.toastEnabled) return;

    const duration = NOTIFICATION_CONFIG.PRIORITY_DURATIONS[options.priority || 'normal'];
    
    const toastOptions = {
      description: options.message,
      duration: options.persist ? Infinity : duration,
      action: options.action ? {
        label: options.action.label,
        onClick: () => {
          window.location.href = options.action!.url;
        }
      } : undefined
    };

    switch (options.priority) {
      case 'urgent':
        toast.error(options.title, toastOptions);
        break;
      case 'high':
        toast.warning(options.title, toastOptions);
        break;
      case 'low':
        toast.info(options.title, toastOptions);
        break;
      default:
        toast.success(options.title, toastOptions);
    }
  }

  /**
   * Notification complète avec son + vibration + toast
   */
  async notify(options: UnifiedNotificationOptions): Promise<void> {
    const {
      sound = true,
      vibrate = true,
      toast: showToast = true,
      priority = 'normal'
    } = options;

    // Exécuter en parallèle pour éviter les délais
    const promises: Promise<void>[] = [];

    if (sound) {
      promises.push(this.playSound(options.category));
    }

    if (vibrate) {
      promises.push(this.vibrate(priority));
    }

    await Promise.all(promises);

    if (showToast) {
      this.showToast(options);
    }
  }

  /**
   * Notification spécifique pour les transports
   */
  async notifyTransport(
    type: 'driver_assigned' | 'driver_arrived' | 'in_progress' | 'completed',
    details?: string
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      driver_assigned: { 
        title: '🚗 Chauffeur assigné !', 
        message: details || 'Votre chauffeur est en route',
        priority: 'high'
      },
      driver_arrived: { 
        title: '📍 Chauffeur arrivé', 
        message: details || 'Votre chauffeur vous attend',
        priority: 'urgent'
      },
      in_progress: { 
        title: '🏁 Course démarrée', 
        message: details || 'Bonne route !',
        priority: 'normal'
      },
      completed: { 
        title: '✅ Course terminée', 
        message: details || 'Merci d\'avoir utilisé TAGA !',
        priority: 'normal'
      }
    };

    const config = messages[type];
    await this.notify({
      ...config,
      category: 'transport',
      action: type === 'completed' ? { label: 'Noter', url: '/transport/rating' } : undefined
    });
  }

  /**
   * Notification spécifique pour les livraisons
   */
  async notifyDelivery(
    type: 'confirmed' | 'picked_up' | 'in_transit' | 'delivered',
    details?: string
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      confirmed: { 
        title: '📦 Commande confirmée', 
        message: details || 'Votre livraison est en préparation',
        priority: 'normal'
      },
      picked_up: { 
        title: '📫 Colis récupéré', 
        message: details || 'Le livreur est en route',
        priority: 'high'
      },
      in_transit: { 
        title: '🛣️ En cours de livraison', 
        message: details || 'Votre colis arrive bientôt',
        priority: 'normal'
      },
      delivered: { 
        title: '🎉 Livraison réussie !', 
        message: details || 'Votre colis a été livré',
        priority: 'high'
      }
    };

    const config = messages[type];
    await this.notify({
      ...config,
      category: 'delivery'
    });
  }

  /**
   * Notification spécifique pour les locations
   */
  async notifyRental(
    type: 'pending' | 'approved_by_partner' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    details?: string
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      pending: { 
        title: '⏳ Demande envoyée', 
        message: details || 'En attente de confirmation du partenaire',
        priority: 'normal'
      },
      approved_by_partner: { 
        title: '✅ Véhicule approuvé !', 
        message: details || 'Procédez au paiement pour confirmer',
        priority: 'urgent'
      },
      confirmed: { 
        title: '🎉 Location confirmée', 
        message: details || 'Votre réservation est confirmée',
        priority: 'high'
      },
      in_progress: { 
        title: '🚗 Location en cours', 
        message: details || 'Profitez de votre véhicule !',
        priority: 'normal'
      },
      completed: { 
        title: '🏁 Location terminée', 
        message: details || 'Merci d\'avoir utilisé notre service',
        priority: 'normal'
      },
      cancelled: { 
        title: '❌ Location annulée', 
        message: details || 'Votre réservation a été annulée',
        priority: 'high'
      }
    };

    const config = messages[type];
    await this.notify({
      ...config,
      category: 'rental'
    });
  }

  /**
   * Notification de loterie
   */
  async notifyLottery(won: boolean, prize?: string): Promise<void> {
    if (won) {
      await this.notify({
        title: '🎉 Vous avez gagné !',
        message: prize || 'Félicitations !',
        category: 'lottery',
        priority: 'urgent'
      });
    }
  }

  /**
   * Notification de paiement
   */
  async notifyPayment(
    type: 'success' | 'failed' | 'pending',
    amount?: string
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      success: { 
        title: '💰 Paiement réussi', 
        message: amount ? `${amount} débité avec succès` : 'Transaction confirmée',
        priority: 'high'
      },
      failed: { 
        title: '❌ Paiement échoué', 
        message: 'Veuillez réessayer ou utiliser une autre méthode',
        priority: 'urgent'
      },
      pending: { 
        title: '⏳ Paiement en cours', 
        message: 'Transaction en cours de traitement',
        priority: 'normal'
      }
    };

    const config = messages[type];
    await this.notify({
      ...config,
      category: 'payment'
    });
  }

  /**
   * Tester un type de son
   */
  async testSound(category: NotificationCategory): Promise<void> {
    await soundGenerator.playSound(CATEGORY_SOUND_MAP[category]);
  }

  /**
   * Initialiser le service (à appeler au démarrage)
   */
  async initialize(): Promise<void> {
    await soundGenerator.initialize();
    soundGenerator.setVolume(this.volume);
    soundGenerator.setEnabled(this.soundEnabled);
  }

  getPreferences() {
    return {
      soundEnabled: this.soundEnabled,
      vibrationEnabled: this.vibrationEnabled,
      toastEnabled: this.toastEnabled,
      volume: this.volume,
      silentHoursStart: this.silentHoursStart,
      silentHoursEnd: this.silentHoursEnd
    };
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();
