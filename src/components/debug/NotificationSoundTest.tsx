import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notificationSoundService } from '@/services/notificationSound';
import { toast } from 'sonner';
import { Volume2, Play } from 'lucide-react';
import { useState, useRef } from 'react';

interface SoundEntry {
  key: string;
  label: string;
  soundType: string;
  emoji: string;
}

interface SoundCategory {
  title: string;
  color: string;
  sounds: SoundEntry[];
}

const soundCategories: SoundCategory[] = [
  {
    title: '🚗 Chauffeur / Driver',
    color: 'border-l-4 border-l-blue-500',
    sounds: [
      { key: 'driverAssigned', label: 'Nouvelle course taxi', soundType: 'transport', emoji: '🚕' },
      { key: 'deliveryPicked', label: 'Nouvelle livraison', soundType: 'delivery', emoji: '📦' },
      { key: 'newOrder', label: 'Commande marketplace', soundType: 'marketplace', emoji: '🛍️' },
      { key: 'urgentAlert', label: 'Enchères urgente', soundType: 'urgent', emoji: '🔴' },
    ]
  },
  {
    title: '🛍️ Marketplace / Vendeur',
    color: 'border-l-4 border-l-purple-500',
    sounds: [
      { key: 'newOrder', label: 'Nouvelle commande', soundType: 'marketplace', emoji: '🛒' },
      { key: 'orderConfirmed', label: 'Commande confirmée', soundType: 'marketplace', emoji: '✅' },
      { key: 'paymentReceived', label: 'Paiement reçu', soundType: 'payment', emoji: '💰' },
      { key: 'productApproved', label: 'Produit approuvé', soundType: 'success', emoji: '👍' },
      { key: 'productRejected', label: 'Produit rejeté', soundType: 'error', emoji: '👎' },
    ]
  },
  {
    title: '🍔 Food / Restaurant',
    color: 'border-l-4 border-l-orange-500',
    sounds: [
      { key: 'newOrder', label: 'Nouvelle commande food', soundType: 'marketplace', emoji: '🍕' },
      { key: 'orderConfirmed', label: 'En préparation', soundType: 'marketplace', emoji: '👨‍🍳' },
      { key: 'success', label: 'Commande prête', soundType: 'success', emoji: '✨' },
      { key: 'error', label: 'Commande annulée', soundType: 'error', emoji: '❌' },
      { key: 'deliveryCompleted', label: 'Livraison food terminée', soundType: 'delivery', emoji: '🏁' },
    ]
  },
  {
    title: '🚘 Transport / Client',
    color: 'border-l-4 border-l-green-500',
    sounds: [
      { key: 'driverAssigned', label: 'Chauffeur assigné', soundType: 'transport', emoji: '👤' },
      { key: 'driverArrived', label: 'Chauffeur arrivé', soundType: 'transport', emoji: '📍' },
      { key: 'rideStarted', label: 'Course démarrée', soundType: 'transport', emoji: '🏎️' },
    ]
  },
  {
    title: '📦 Livraison / Client',
    color: 'border-l-4 border-l-yellow-500',
    sounds: [
      { key: 'deliveryPicked', label: 'Colis récupéré', soundType: 'delivery', emoji: '📥' },
      { key: 'deliveryCompleted', label: 'Livraison terminée', soundType: 'delivery', emoji: '✅' },
    ]
  },
  {
    title: '🔑 Location / Loterie / Chat / Admin',
    color: 'border-l-4 border-l-pink-500',
    sounds: [
      { key: 'general', label: 'Réservation location', soundType: 'success', emoji: '🚙' },
      { key: 'success', label: 'Gain loterie', soundType: 'success', emoji: '🎰' },
      { key: 'message', label: 'Nouveau message', soundType: 'chat', emoji: '💬' },
      { key: 'urgentAlert', label: 'Alerte admin', soundType: 'urgent', emoji: '🚨' },
    ]
  },
  {
    title: '🔔 Génériques',
    color: 'border-l-4 border-l-gray-500',
    sounds: [
      { key: 'success', label: 'Succès', soundType: 'success', emoji: '✅' },
      { key: 'error', label: 'Erreur', soundType: 'error', emoji: '❌' },
      { key: 'warning', label: 'Avertissement', soundType: 'warning', emoji: '⚠️' },
      { key: 'info', label: 'Information', soundType: 'info', emoji: 'ℹ️' },
      { key: 'general', label: 'Notification générale', soundType: 'general', emoji: '🔔' },
    ]
  }
];

export const NotificationSoundTest = () => {
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const stopRef = useRef(false);

  const playSound = (sound: SoundEntry) => {
    notificationSoundService.playNotificationSound(sound.key as any);
    toast.info(`${sound.emoji} ${sound.label}`, {
      description: `Son: ${sound.soundType}`,
      duration: 1500,
    });
  };

  const playAllSounds = async () => {
    const allSounds = soundCategories.flatMap(c => c.sounds);
    setIsPlayingAll(true);
    stopRef.current = false;

    for (const sound of allSounds) {
      if (stopRef.current) break;
      playSound(sound);
      await new Promise(r => setTimeout(r, 800));
    }
    setIsPlayingAll(false);
  };

  const stopPlayback = () => {
    stopRef.current = true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          🧪 Test des sons — Tous les services
        </CardTitle>
        <CardDescription>
          Testez tous les sons de notification par service métier. Le type de son synthétique est indiqué sous chaque bouton.
        </CardDescription>
        <div className="pt-2">
          {isPlayingAll ? (
            <Button variant="destructive" size="sm" onClick={stopPlayback}>
              ⏹ Arrêter
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={playAllSounds} className="gap-2">
              <Play className="h-4 w-4" />
              Jouer tous les sons
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {soundCategories.map((category, idx) => (
          <div key={idx} className={`space-y-3 pl-3 ${category.color}`}>
            <h3 className="font-semibold text-sm text-muted-foreground">{category.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {category.sounds.map((sound, sIdx) => (
                <Button
                  key={`${idx}-${sIdx}`}
                  variant="outline"
                  size="sm"
                  onClick={() => playSound(sound)}
                  className="justify-start text-left h-auto py-2 px-3 flex-col items-start"
                >
                  <span className="text-xs font-medium">{sound.emoji} {sound.label}</span>
                  <span className="text-[10px] text-muted-foreground">son: {sound.soundType}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
