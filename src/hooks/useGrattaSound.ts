import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { CardType } from '@/types/kwenda-gratta';

// Configurations sonores "Ching!" par type de carte
const CHING_CONFIGS = {
  standard: {
    frequencies: [800, 1200],
    duration: 150,
    gain: 0.3
  },
  active: {
    frequencies: [900, 1400],
    duration: 200,
    gain: 0.4
  },
  rare: {
    frequencies: [1000, 1500, 2000],
    duration: 250,
    gain: 0.5
  },
  mega: {
    frequencies: [1200, 1800, 2400, 600],
    duration: 400,
    gain: 0.6
  }
};

// Configurations haptiques par type
const HAPTIC_CONFIGS = {
  scratching: ImpactStyle.Light,
  standard: ImpactStyle.Light,
  active: ImpactStyle.Medium,
  rare: ImpactStyle.Heavy,
  mega: NotificationType.Success
};

export const useGrattaSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastHapticTime = useRef(0);
  const isNative = Capacitor.isNativePlatform();

  // Initialiser le contexte audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Jouer le son "Ching!" synthétique congolais
  const playChingSound = useCallback((cardType: CardType = 'standard') => {
    try {
      const ctx = getAudioContext();
      const config = CHING_CONFIGS[cardType];
      const now = ctx.currentTime;

      // Créer un gain node pour le volume
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(config.gain, now + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + config.duration / 1000);

      // Créer les oscillateurs pour les fréquences harmoniques
      config.frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Type d'onde différent pour plus de richesse
        oscillator.type = index === 0 ? 'sine' : index === 1 ? 'triangle' : 'square';
        oscillator.frequency.setValueAtTime(freq, now);
        
        // Glissando vers le haut pour effet "ching"
        oscillator.frequency.exponentialRampToValueAtTime(
          freq * 1.5, 
          now + config.duration / 2000
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          freq * 0.8, 
          now + config.duration / 1000
        );

        // Volume décroissant pour chaque harmonique
        gainNode.gain.setValueAtTime(1 / (index + 1), now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration / 1000);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.start(now);
        oscillator.stop(now + config.duration / 1000);
      });

      // Son de "cloche" additionnel pour cartes rares/mega
      if (cardType === 'rare' || cardType === 'mega') {
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(2500, now);
        bellOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
        
        bellGain.gain.setValueAtTime(0.2, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);
        
        bellOsc.start(now);
        bellOsc.stop(now + 0.3);
      }

      console.log(`🔊 Ching! sound played: ${cardType}`);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }, [getAudioContext]);

  // Haptic feedback pendant le grattage
  const playScatchHaptic = useCallback(async () => {
    if (!isNative) return;
    
    // Limiter la fréquence des vibrations (pas plus d'une toutes les 100ms)
    const now = Date.now();
    if (now - lastHapticTime.current < 100) return;
    lastHapticTime.current = now;

    try {
      await Haptics.impact({ style: HAPTIC_CONFIGS.scratching });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }, [isNative]);

  // Haptic feedback lors de la révélation
  const playRevealHaptic = useCallback(async (cardType: CardType = 'standard') => {
    if (!isNative) return;

    try {
      if (cardType === 'mega') {
        // Vibration longue de célébration pour Méga Carte
        await Haptics.notification({ type: NotificationType.Success });
        // Double vibration
        setTimeout(async () => {
          await Haptics.notification({ type: NotificationType.Success });
        }, 200);
      } else {
        await Haptics.impact({ style: HAPTIC_CONFIGS[cardType] as ImpactStyle });
      }
      console.log(`📳 Haptic played: ${cardType}`);
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }, [isNative]);

  // Effet combiné son + haptics pour révélation
  const playRevealFeedback = useCallback(async (cardType: CardType = 'standard') => {
    playChingSound(cardType);
    await playRevealHaptic(cardType);
  }, [playChingSound, playRevealHaptic]);

  // Jouer un son de scratch léger
  const playScratchSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Bruit blanc léger pour simuler le grattage
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      // Filtre passe-haut pour son de grattage
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3000, now);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.05);
    } catch (error) {
      // Silently fail
    }
  }, [getAudioContext]);

  return {
    playChingSound,
    playScatchHaptic,
    playRevealHaptic,
    playRevealFeedback,
    playScratchSound
  };
};
