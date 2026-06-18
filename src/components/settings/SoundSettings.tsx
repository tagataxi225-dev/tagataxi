import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { notificationSoundService } from '@/services/notificationSound';
import { toast } from 'sonner';

export const SoundSettings = () => {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    setEnabled(notificationSoundService.getSoundEnabled());
    setVolume(notificationSoundService.getVolume());
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    notificationSoundService.setSoundEnabled(checked);
    toast.success(checked ? '🔊 Sons activés' : '🔇 Sons désactivés');
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    notificationSoundService.setVolume(newVolume);
  };

  const testSound = () => {
    notificationSoundService.playNotificationSound('general');
    toast.info('🔊 Test du son de notification');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
          Sons des notifications
        </CardTitle>
        <CardDescription>
          Gérez les préférences audio pour vos notifications TAGA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Activer les sons</label>
            <p className="text-xs text-muted-foreground">
              Jouer un son lors de nouvelles notifications
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>
        
        {enabled && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <Button onClick={testSound} variant="outline" className="w-full" size="sm">
              <TestTube className="h-4 w-4 mr-2" />
              Tester le son
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
