/**
 * Générateur de sons synthétiques professionnels avec Web Audio API
 * Pas besoin de fichiers MP3 externes
 */

export type NotificationSoundType = 
  | 'transport' 
  | 'delivery' 
  | 'marketplace' 
  | 'chat' 
  | 'lottery'
  | 'success' 
  | 'error' 
  | 'warning'
  | 'urgent'
  | 'rental'
  | 'payment';

interface SoundConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  gainCurve: number[];
  delay?: number;
}

const SOUND_CONFIGS: Record<NotificationSoundType, SoundConfig> = {
  // Transport: Double ding harmonieux
  transport: {
    frequencies: [1047, 1319, 1568, 1319, 1568, 2093],
    durations: [80, 80, 120, 60, 80, 200],
    type: 'sine',
    gainCurve: [0.35, 0.4, 0.45, 0.3, 0.4, 0.55],
    delay: 60
  },
  
  // Delivery: Son de swipe montant
  delivery: {
    frequencies: [400, 600, 800, 1000],
    durations: [60, 60, 60, 100],
    type: 'sine',
    gainCurve: [0.2, 0.25, 0.3, 0.2],
    delay: 50
  },
  
  // Marketplace: Ka-ching monétaire
  marketplace: {
    frequencies: [1200, 1400, 1600],
    durations: [50, 50, 200],
    type: 'triangle',
    gainCurve: [0.3, 0.35, 0.25],
    delay: 40
  },
  
  // Chat: Pop léger
  chat: {
    frequencies: [800, 1000],
    durations: [60, 80],
    type: 'sine',
    gainCurve: [0.25, 0.15],
    delay: 30
  },
  
  // Lottery: Fanfare courte
  lottery: {
    frequencies: [523, 659, 784, 1047],
    durations: [100, 100, 100, 250],
    type: 'triangle',
    gainCurve: [0.2, 0.25, 0.3, 0.35],
    delay: 100
  },
  
  // Success: Accord montant harmonique
  success: {
    frequencies: [523, 659, 784],
    durations: [80, 80, 200],
    type: 'sine',
    gainCurve: [0.2, 0.25, 0.2],
    delay: 60
  },
  
  // Error: Son descendant dissonant
  error: {
    frequencies: [440, 350, 280],
    durations: [100, 100, 200],
    type: 'sawtooth',
    gainCurve: [0.2, 0.25, 0.15],
    delay: 80
  },
  
  // Warning: Bip double
  warning: {
    frequencies: [600, 600],
    durations: [100, 150],
    type: 'square',
    gainCurve: [0.15, 0.2],
    delay: 150
  },
  
  // Urgent: Sirène courte
  urgent: {
    frequencies: [800, 1000, 800, 1000],
    durations: [80, 80, 80, 150],
    type: 'square',
    gainCurve: [0.25, 0.3, 0.25, 0.3],
    delay: 60
  },
  
  // Rental: Son de clé / réservation
  rental: {
    frequencies: [700, 900, 1100],
    durations: [80, 80, 180],
    type: 'sine',
    gainCurve: [0.25, 0.3, 0.2],
    delay: 70
  },
  
  // Payment: Son de caisse
  payment: {
    frequencies: [1000, 1300, 1600],
    durations: [50, 50, 180],
    type: 'triangle',
    gainCurve: [0.3, 0.35, 0.25],
    delay: 40
  }
};

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private volume = 0.5;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  // Déverrouillage audio mobile : doit être appelé depuis un vrai geste utilisateur
  async unlock(): Promise<void> {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') await ctx.resume();
      // joue un buffer muet pour armer l'audio sur iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async playSound(type: NotificationSoundType): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.initialize();
      const ctx = this.getContext();
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const config = SOUND_CONFIGS[type];
      let currentTime = ctx.currentTime;

      for (let i = 0; i < config.frequencies.length; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = config.type;
        oscillator.frequency.value = config.frequencies[i];
        
        const duration = config.durations[i] / 1000;
        const gain = config.gainCurve[i] * this.volume;
        
        // Envelope ADSR simple
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(gain, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration + 0.05);
        
        currentTime += (config.delay || 50) / 1000;
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Jouer un son personnalisé avec fréquence et durée
  async playCustomTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.initialize();
      const ctx = this.getContext();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      const durationSec = duration / 1000;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3 * this.volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSec);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + durationSec + 0.05);
    } catch (error) {
      console.warn('Failed to play custom tone:', error);
    }
  }

  // Test tous les sons (utile pour le panneau de debug)
  async testAllSounds(delayMs = 500): Promise<void> {
    const types = Object.keys(SOUND_CONFIGS) as NotificationSoundType[];
    
    for (const type of types) {
      await this.playSound(type);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export const soundGenerator = new SoundGenerator();
