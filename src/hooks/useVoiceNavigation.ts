import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VoiceSettings } from '@/types/navigation';

export const useVoiceNavigation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    volume: 0.8,
    language: 'fr',
    voice: 'Aria',
    autoPlay: true
  });
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const generateVoiceInstruction = useCallback(async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-navigation', {
        body: { 
          text: text,
          voice: settings.voice 
        }
      });

      if (error) throw error;
      
      return data.audioContent;
    } catch (error) {
      console.error('Voice generation failed:', error);
      toast({
        title: "Erreur vocale",
        description: "Impossible de générer l'instruction vocale",
        variant: "destructive"
      });
      return null;
    }
  }, [settings.voice, toast]);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!settings.enabled || !base64Audio) return;

    try {
      setIsPlaying(true);
      
      // Create audio element if not exists
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.volume = settings.volume;
      audio.src = `data:audio/mpeg;base64,${base64Audio}`;

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          setIsPlaying(false);
          resolve(void 0);
        };
        audio.onerror = reject;
        audio.play();
      });
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
    }
  }, [settings.enabled, settings.volume]);

  const speakInstruction = useCallback(async (instruction: string) => {
    if (!settings.enabled) return;

    const audioContent = await generateVoiceInstruction(instruction);
    if (audioContent) {
      await playAudio(audioContent);
    }
  }, [settings.enabled, generateVoiceInstruction, playAudio]);

  const queueInstruction = useCallback(async (instruction: string) => {
    if (!settings.autoPlay) return;
    
    setAudioQueue(prev => [...prev, instruction]);
    
    if (!isPlaying) {
      await speakInstruction(instruction);
    }
  }, [settings.autoPlay, isPlaying, speakInstruction]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioQueue([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Format navigation instructions for voice
  const formatNavigationInstruction = useCallback((
    maneuver: string, 
    distance: number, 
    streetName?: string
  ): string => {
    const distanceText = distance < 1000 
      ? `dans ${Math.round(distance)} mètres`
      : `dans ${(distance / 1000).toFixed(1)} kilomètres`;

    const streetInfo = streetName ? ` sur ${streetName}` : '';

    switch (maneuver) {
      case 'turn-left':
        return `Tournez à gauche ${distanceText}${streetInfo}`;
      case 'turn-right':
        return `Tournez à droite ${distanceText}${streetInfo}`;
      case 'straight':
        return `Continuez tout droit ${distanceText}${streetInfo}`;
      case 'uturn':
        return `Faites demi-tour ${distanceText}`;
      case 'arrive':
        return `Vous arrivez à destination ${distanceText}`;
      case 'depart':
        return `Démarrez votre voyage${streetInfo}`;
      default:
        return `Continuez ${distanceText}${streetInfo}`;
    }
  }, []);

  return {
    isPlaying,
    settings,
    audioQueue,
    speakInstruction,
    queueInstruction,
    stopSpeaking,
    updateSettings,
    formatNavigationInstruction
  };
};