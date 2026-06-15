/**
 * 🔊 Audio Service - Délègue au soundGenerator unifié
 */
import { soundGenerator, NotificationSoundType } from '@/utils/soundGenerator';

// Mapping des clés legacy vers les types du soundGenerator
const KEY_MAP: Record<string, NotificationSoundType> = {
  new_ride: 'transport',
  ride_accepted: 'success',
  navigation_turn: 'delivery',
  arrival: 'transport',
  completed: 'success'
};

class AudioService {
  private enabled = true;

  async preloadSounds(): Promise<void> {
    await soundGenerator.initialize();
    console.log('🔊 Audio service initialized (unified)');
  }

  async play(soundKey: string, volume: number = 1.0): Promise<void> {
    if (!this.enabled) return;
    soundGenerator.setVolume(volume);
    const type = KEY_MAP[soundKey] || 'success';
    await soundGenerator.playSound(type);
  }

  stop(): void {
    // Sons synthétiques ne sont pas stoppables (très courts)
  }

  stopAll(): void {
    // Pas nécessaire pour sons synthétiques
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    soundGenerator.setEnabled(enabled);
  }

  sounds = {
    newRide: () => this.play('new_ride', 1.0),
    stopNewRide: () => this.stop(),
    rideAccepted: () => this.play('ride_accepted', 0.8),
    navigationTurn: () => this.play('navigation_turn', 0.6),
    arrival: () => this.play('arrival', 0.8),
    completed: () => this.play('completed', 0.9)
  };
}

export const audioService = new AudioService();

if (typeof window !== 'undefined') {
  audioService.preloadSounds();
}
