/**
 * Panneau de test pour les notifications
 * Accessible dans les paramètres pour tester tous les sons et notifications
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Car, 
  Package, 
  ShoppingBag, 
  Key, 
  Gift,
  MessageCircle,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Play,
  Smartphone
} from 'lucide-react';
import { useUnifiedPushNotifications } from '@/hooks/useUnifiedPushNotifications';
import { soundGenerator, NotificationSoundType } from '@/utils/soundGenerator';
import { unifiedNotificationService, NotificationCategory } from '@/services/unifiedNotificationService';

const SOUND_TESTS: { type: NotificationSoundType; label: string; icon: React.ReactNode }[] = [
  { type: 'transport', label: 'Transport', icon: <Car className="h-4 w-4" /> },
  { type: 'delivery', label: 'Livraison', icon: <Package className="h-4 w-4" /> },
  { type: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="h-4 w-4" /> },
  { type: 'rental', label: 'Location', icon: <Key className="h-4 w-4" /> },
  { type: 'lottery', label: 'Loterie', icon: <Gift className="h-4 w-4" /> },
  { type: 'chat', label: 'Chat', icon: <MessageCircle className="h-4 w-4" /> },
  { type: 'payment', label: 'Paiement', icon: <CreditCard className="h-4 w-4" /> },
  { type: 'success', label: 'Succès', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'warning', label: 'Avertissement', icon: <AlertTriangle className="h-4 w-4" /> },
  { type: 'urgent', label: 'Urgent', icon: <Bell className="h-4 w-4" /> }
];

const NOTIFICATION_TESTS: { category: NotificationCategory; title: string; message: string }[] = [
  { category: 'transport', title: '🚗 Chauffeur assigné', message: 'Votre chauffeur arrive dans 5 minutes' },
  { category: 'delivery', title: '📦 Colis récupéré', message: 'Le livreur est en route' },
  { category: 'rental', title: '✅ Location approuvée', message: 'Procédez au paiement' },
  { category: 'marketplace', title: '🛍️ Nouvelle commande', message: 'Un client a passé commande' },
  { category: 'lottery', title: '🎉 Vous avez gagné !', message: '5000 CDF de crédits' }
];

export const NotificationTestPanel = () => {
  const { 
    isEnabled, 
    isMobile, 
    token, 
    requestPermission, 
    notify,
    getPreferences,
    savePreferences
  } = useUnifiedPushNotifications();

  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const prefs = getPreferences();

  const handlePlaySound = async (type: NotificationSoundType) => {
    setPlayingSound(type);
    await soundGenerator.playSound(type);
    setTimeout(() => setPlayingSound(null), 500);
  };

  const handleTestNotification = async (test: typeof NOTIFICATION_TESTS[0]) => {
    await notify({
      title: test.title,
      message: test.message,
      category: test.category,
      priority: 'high'
    });
  };

  const handleVolumeChange = (value: number[]) => {
    savePreferences({ volume: value[0] / 100 });
  };

  return (
    <div className="space-y-6">
      {/* État des permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            État des Notifications
          </CardTitle>
          <CardDescription>
            Vérifiez et configurez les permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span>Plateforme</span>
            </div>
            <Badge variant={isMobile ? 'default' : 'secondary'}>
              {isMobile ? 'Mobile Natif' : 'Navigateur Web'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span>Notifications</span>
            </div>
            <Badge variant={isEnabled ? 'default' : 'destructive'}>
              {isEnabled ? 'Activées' : 'Désactivées'}
            </Badge>
          </div>

          {!isEnabled && (
            <Button onClick={requestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Activer les notifications
            </Button>
          )}

          {isMobile && token && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-mono break-all">
                Token: {token.substring(0, 30)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Préférences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span>Sons activés</span>
            </div>
            <Switch 
              checked={prefs.soundEnabled} 
              onCheckedChange={(checked) => savePreferences({ soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="h-4 w-4" />
              <span>Vibrations</span>
            </div>
            <Switch 
              checked={prefs.vibrationEnabled} 
              onCheckedChange={(checked) => savePreferences({ vibrationEnabled: checked })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Volume</span>
              <span className="text-sm text-muted-foreground">{Math.round(prefs.volume * 100)}%</span>
            </div>
            <Slider
              value={[prefs.volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test des sons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Tester les Sons
          </CardTitle>
          <CardDescription>
            Cliquez pour écouter chaque type de son
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {SOUND_TESTS.map(({ type, label, icon }) => (
              <Button
                key={type}
                variant={playingSound === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePlaySound(type)}
                className="justify-start"
              >
                {icon}
                <span className="ml-2">{label}</span>
                {playingSound === type && (
                  <Play className="h-3 w-3 ml-auto animate-pulse" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test des notifications complètes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tester les Notifications
          </CardTitle>
          <CardDescription>
            Déclenche une notification complète (son + vibration + toast)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {NOTIFICATION_TESTS.map((test) => (
              <Button
                key={test.category}
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification(test)}
                className="w-full justify-start"
              >
                <span>{test.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
