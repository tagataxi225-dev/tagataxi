import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Languages,
  Speaker,
  Square
} from 'lucide-react';
import type { VoiceSettings } from '@/types/navigation';

interface VoiceControlPanelProps {
  settings: VoiceSettings;
  isPlaying: boolean;
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
  onStopSpeaking: () => void;
}

export const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  settings,
  isPlaying,
  onSettingsChange,
  onStopSpeaking
}) => {
  const voices = [
    { id: 'Aria', name: 'Aria (Féminine)' },
    { id: 'Roger', name: 'Roger (Masculine)' },
    { id: 'Sarah', name: 'Sarah (Féminine)' },
    { id: 'Charlie', name: 'Charlie (Masculine)' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Speaker className="h-4 w-4" />
          Contrôles vocaux
          {isPlaying && (
            <Badge variant="default" className="text-xs animate-pulse">
              En cours
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.enabled ? (
              <Mic className="h-4 w-4 text-green-600" />
            ) : (
              <MicOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">Instructions vocales</span>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onSettingsChange({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="text-sm">Volume</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => onSettingsChange({ volume })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <span className="text-sm">Langue</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={settings.language === 'fr' ? 'default' : 'outline'}
                  onClick={() => onSettingsChange({ language: 'fr' })}
                  className="flex-1"
                >
                  Français
                </Button>
                <Button
                  size="sm"
                  variant={settings.language === 'en' ? 'default' : 'outline'}
                  onClick={() => onSettingsChange({ language: 'en' })}
                  className="flex-1"
                >
                  English
                </Button>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Speaker className="h-4 w-4" />
                <span className="text-sm">Voix</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {voices.map((voice) => (
                  <Button
                    key={voice.id}
                    size="sm"
                    variant={settings.voice === voice.id ? 'default' : 'outline'}
                    onClick={() => onSettingsChange({ voice: voice.id })}
                    className="text-xs"
                  >
                    {voice.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-play Setting */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Lecture automatique</span>
              <Switch
                checked={settings.autoPlay}
                onCheckedChange={(autoPlay) => onSettingsChange({ autoPlay })}
              />
            </div>

            {/* Stop Speaking Button */}
            {isPlaying && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopSpeaking}
                className="w-full flex items-center gap-2"
              >
                <Square className="h-3 w-3" />
                Arrêter la lecture
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};