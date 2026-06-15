import { soundGenerator, NotificationSoundType } from '@/utils/soundGenerator';

interface NotificationSounds {
  newOrder: string;
  orderConfirmed: string;
  paymentReceived: string;
  productApproved: string;
  productRejected: string;
  productFlagged: string;
  lowStockAlert: string;
  reviewReceived: string;
  driverAssigned: string;
  driverArrived: string;
  rideStarted: string;
  deliveryPicked: string;
  deliveryCompleted: string;
  urgentAlert: string;
  message: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  general: string;
}

// Mapping des clés de notification vers les types du soundGenerator
const SOUND_TYPE_MAP: Record<keyof NotificationSounds, NotificationSoundType> = {
  // Marketplace
  newOrder: 'marketplace',
  orderConfirmed: 'marketplace',
  paymentReceived: 'payment',
  productApproved: 'marketplace',
  productRejected: 'warning',
  productFlagged: 'warning',
  lowStockAlert: 'warning',
  reviewReceived: 'marketplace',
  
  // Transport
  driverAssigned: 'transport',
  driverArrived: 'transport',
  rideStarted: 'transport',
  
  // Livraison
  deliveryPicked: 'delivery',
  deliveryCompleted: 'delivery',
  
  // Admin
  urgentAlert: 'urgent',
  
  // Chat
  message: 'chat',
  
  // Génériques
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'success',
  general: 'success'
};

class NotificationSoundService {
  private soundEnabled: boolean = true;
  private volume: number = 0.9;

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    soundGenerator.setEnabled(enabled);
    localStorage.setItem('kwenda_sounds_enabled', String(enabled));
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    soundGenerator.setVolume(this.volume);
    localStorage.setItem('kwenda_sounds_volume', String(volume));
  }

  getSoundEnabled(): boolean {
    const stored = localStorage.getItem('kwenda_sounds_enabled');
    return stored !== null ? stored === 'true' : true;
  }

  getVolume(): number {
    const stored = localStorage.getItem('kwenda_sounds_volume');
    return stored ? parseFloat(stored) : 0.9;
  }

  async playNotificationSound(type: keyof NotificationSounds = 'general') {
    // Charger préférences
    this.soundEnabled = this.getSoundEnabled();
    this.volume = this.getVolume();

    if (!this.soundEnabled) return;

    // Synchroniser volume avec soundGenerator
    soundGenerator.setVolume(this.volume);
    soundGenerator.setEnabled(true);

    try {
      const soundType = SOUND_TYPE_MAP[type] || 'success';
      await soundGenerator.playSound(soundType);
      this.triggerVibration(type);
    } catch (error) {
      console.warn(`❌ [NotifSound] Erreur: ${type}`, error);
      this.triggerVibration(type);
    }
  }

  private triggerVibration(type: keyof NotificationSounds) {
    if (!('vibrate' in navigator)) return;

    const vibrationPatterns: Record<string, number | number[]> = {
      newOrder: [100, 50, 100],
      orderConfirmed: [100, 50, 100],
      paymentReceived: [50, 30, 50, 30, 50],
      driverAssigned: [100, 50, 100],
      driverArrived: [200],
      rideStarted: [100],
      deliveryPicked: [50, 30, 50],
      deliveryCompleted: [100, 50, 100, 50, 200],
      urgentAlert: [200, 100, 200, 100, 200],
      error: [200, 100, 200],
      warning: [150],
      success: [50, 30, 50],
      message: [50],
      general: [100],
      info: [50]
    };

    const pattern = vibrationPatterns[type] || 100;
    navigator.vibrate(pattern);
  }

  async preloadSounds() {
    // soundGenerator n'a pas besoin de preload (sons synthétiques)
    await soundGenerator.initialize();
  }
}

export const notificationSoundService = new NotificationSoundService();
