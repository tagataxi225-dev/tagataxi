import { useCallback, useEffect } from 'react';
import { soundGenerator, NotificationSoundType } from '@/utils/soundGenerator';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface NotificationSoundOptions {
  enabled?: boolean;
  volume?: number;
}

// Mapping des types de notifications vers les types du soundGenerator
const TYPE_MAP: Record<string, NotificationSoundType> = {
  transport: 'transport',
  delivery: 'delivery',
  marketplace: 'marketplace',
  lottery: 'lottery',
  wallet: 'payment',
  chat: 'chat',
  system: 'success',
  default: 'success'
};

// Mapping des noms de sons vers les types
const SOUND_NAME_MAP: Record<string, NotificationSoundType> = {
  driverAssigned: 'transport',
  driverArrived: 'transport',
  rideStarted: 'transport',
  orderConfirmed: 'marketplace',
  deliveryPicked: 'delivery',
  deliveryCompleted: 'delivery',
  newOrder: 'marketplace',
  paymentReceived: 'payment',
  message: 'chat',
  general: 'success',
  success: 'success',
  error: 'error',
  warning: 'warning',
  urgentAlert: 'urgent'
};

export const useNotificationSound = (options: NotificationSoundOptions = {}) => {
  const { enabled = true, volume = 0.7 } = options;

  useEffect(() => {
    soundGenerator.setVolume(volume);
    soundGenerator.setEnabled(enabled);
  }, [enabled, volume]);

  const playSyntheticSound = useCallback((type: string) => {
    if (!enabled) return;
    const soundType = (TYPE_MAP[type] || 'success') as NotificationSoundType;
    soundGenerator.playSound(soundType);
  }, [enabled]);

  const playSound = useCallback(async (type: string) => {
    if (!enabled) return;
    const soundType = TYPE_MAP[type] || TYPE_MAP['default'];
    await soundGenerator.playSound(soundType);
  }, [enabled]);

  const playNotificationSound = useCallback((eventKey: string) => {
    if (!enabled) return;
    const soundType = NOTIFICATION_CONFIG.SOUND_MAPPING[eventKey as keyof typeof NOTIFICATION_CONFIG.SOUND_MAPPING] || 'general';
    const mappedType = SOUND_NAME_MAP[soundType] || 'success';
    soundGenerator.playSound(mappedType);
  }, [enabled]);

  return {
    playSound,
    playNotificationSound,
    playSyntheticSound
  };
};
