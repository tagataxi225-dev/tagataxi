import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Volume2, VolumeX, Vibrate, 
  Clock, Car, Package, ShoppingBag, Utensils, 
  Gift, MessageCircle, CreditCard, Settings,
  Moon, ChevronDown, ChevronUp, Check, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';
import { cn } from '@/lib/utils';

export interface CategoryPreference {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface NotificationPreferences {
  globalEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  silentHours: {
    enabled: boolean;
    start: number;
    end: number;
  };
  summaryMode: 'instant' | 'grouped' | 'daily';
  categories: {
    transport: CategoryPreference;
    delivery: CategoryPreference;
    marketplace: CategoryPreference;
    food: CategoryPreference;
    job: CategoryPreference;
    lottery: CategoryPreference;
    chat: CategoryPreference;
    payment: CategoryPreference;
    system: CategoryPreference;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  globalEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 70,
  silentHours: {
    enabled: false,
    start: 22,
    end: 7
  },
  summaryMode: 'instant',
  categories: {
    transport: { enabled: true, sound: true, vibration: true },
    delivery: { enabled: true, sound: true, vibration: true },
    marketplace: { enabled: true, sound: true, vibration: true },
    food: { enabled: true, sound: true, vibration: true },
    job: { enabled: true, sound: true, vibration: true },
    lottery: { enabled: true, sound: true, vibration: true },
    chat: { enabled: true, sound: true, vibration: true },
    payment: { enabled: true, sound: true, vibration: true },
    system: { enabled: true, sound: false, vibration: false },
  }
};

const CATEGORY_CONFIG = [
  { key: 'transport', icon: Car, label: 'Transport', description: 'Courses VTC et taxis' },
  { key: 'delivery', icon: Package, label: 'Livraison', description: 'Statut des colis' },
  { key: 'marketplace', icon: ShoppingBag, label: 'Marketplace', description: 'Commandes et messages' },
  { key: 'food', icon: Utensils, label: 'Food', description: 'Commandes repas' },
  { key: 'job', icon: Briefcase, label: 'TAGA Job', description: 'Nouvelles offres d\'emploi' },
  { key: 'lottery', icon: Gift, label: 'Loterie', description: 'Tirages et gains' },
  { key: 'chat', icon: MessageCircle, label: 'Chat', description: 'Messages directs' },
  { key: 'payment', icon: CreditCard, label: 'Paiements', description: 'Transactions' },
  { key: 'system', icon: Settings, label: 'Système', description: 'Mises à jour app' },
] as const;

interface NotificationPreferencesPanelProps {
  className?: string;
  onSave?: (prefs: NotificationPreferences) => void;
}

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  className,
  onSave
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Charger les préférences sauvegardées
    const saved = localStorage.getItem('notification_preferences_v2');
    if (saved) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      } catch {
        // Utiliser les valeurs par défaut
      }
    }
  }, []);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateCategoryPreference = (
    category: keyof NotificationPreferences['categories'],
    field: keyof CategoryPreference,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('notification_preferences_v2', JSON.stringify(preferences));
    
    // Mettre à jour le service unifié
    unifiedNotificationService.savePreferences({
      soundEnabled: preferences.soundEnabled,
      vibrationEnabled: preferences.vibrationEnabled,
      volume: preferences.volume / 100,
      silentHoursStart: preferences.silentHours.enabled ? preferences.silentHours.start : null,
      silentHoursEnd: preferences.silentHours.enabled ? preferences.silentHours.end : null
    });

    setHasChanges(false);
    onSave?.(preferences);
  };

  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}h00`;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header avec toggle global */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.globalEnabled ? (
                <div className="p-2 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-muted">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {preferences.globalEnabled ? 'Activées' : 'Désactivées'}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={preferences.globalEnabled}
              onCheckedChange={(checked) => updatePreference('globalEnabled', checked)}
            />
          </div>
        </CardHeader>
      </Card>

      {preferences.globalEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          {/* Sons et vibrations */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              {/* Son */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Label>Sons de notification</Label>
                </div>
                <Switch
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
                />
              </div>

              {preferences.soundEnabled && (
                <div className="pl-8 space-y-2">
                  <Label className="text-sm text-muted-foreground">Volume</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[preferences.volume]}
                      onValueChange={([v]) => updatePreference('volume', v)}
                      max={100}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-muted-foreground">{preferences.volume}%</span>
                  </div>
                </div>
              )}

              {/* Vibration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Vibrate className={cn(
                    "h-5 w-5",
                    preferences.vibrationEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Label>Vibrations</Label>
                </div>
                <Switch
                  checked={preferences.vibrationEnabled}
                  onCheckedChange={(checked) => updatePreference('vibrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Heures silencieuses */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className={cn(
                    "h-5 w-5",
                    preferences.silentHours.enabled ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div>
                    <Label>Heures silencieuses</Label>
                    <p className="text-xs text-muted-foreground">
                      Pas de sons ni vibrations pendant cette période
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.silentHours.enabled}
                  onCheckedChange={(checked) => updatePreference('silentHours', {
                    ...preferences.silentHours,
                    enabled: checked
                  })}
                />
              </div>

              {preferences.silentHours.enabled && (
                <div className="flex items-center gap-3 pl-8">
                  <Select
                    value={preferences.silentHours.start.toString()}
                    onValueChange={(v) => updatePreference('silentHours', {
                      ...preferences.silentHours,
                      start: parseInt(v)
                    })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{formatHour(i)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">à</span>
                  <Select
                    value={preferences.silentHours.end.toString()}
                    onValueChange={(v) => updatePreference('silentHours', {
                      ...preferences.silentHours,
                      end: parseInt(v)
                    })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{formatHour(i)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mode de résumé */}
          <Card>
            <CardContent className="pt-4">
              <Label className="mb-3 block">Mode de notification</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'instant', label: 'Instantané', desc: 'En temps réel' },
                  { value: 'grouped', label: 'Groupé', desc: 'Par lot' },
                  { value: 'daily', label: 'Quotidien', desc: 'Résumé 9h' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updatePreference('summaryMode', mode.value as any)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      preferences.summaryMode === mode.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-sm font-medium">{mode.label}</p>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Préférences par catégorie */}
          <Collapsible open={expandedCategories} onOpenChange={setExpandedCategories}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Préférences par catégorie</CardTitle>
                      <CardDescription>Personnaliser chaque type de notification</CardDescription>
                    </div>
                    {expandedCategories ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {CATEGORY_CONFIG.map(({ key, icon: Icon, label, description }) => {
                    const categoryKey = key as keyof NotificationPreferences['categories'];
                    const pref = preferences.categories[categoryKey];
                    
                    return (
                      <div
                        key={key}
                        className={cn(
                          "p-3 rounded-xl border transition-all",
                          pref.enabled ? "border-primary/20 bg-primary/5" : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              pref.enabled ? "bg-primary/10" : "bg-muted"
                            )}>
                              <Icon className={cn(
                                "h-4 w-4",
                                pref.enabled ? "text-primary" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-xs text-muted-foreground">{description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={pref.enabled}
                            onCheckedChange={(v) => updateCategoryPreference(categoryKey, 'enabled', v)}
                          />
                        </div>

                        {pref.enabled && (
                          <div className="flex gap-4 pl-11">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={pref.sound}
                                onChange={(e) => updateCategoryPreference(categoryKey, 'sound', e.target.checked)}
                                className="rounded border-primary text-primary focus:ring-primary"
                              />
                              <Volume2 className="h-3.5 w-3.5" />
                              Son
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={pref.vibration}
                                onChange={(e) => updateCategoryPreference(categoryKey, 'vibration', e.target.checked)}
                                className="rounded border-primary text-primary focus:ring-primary"
                              />
                              <Vibrate className="h-3.5 w-3.5" />
                              Vibration
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
      )}

      {/* Bouton de sauvegarde */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4"
        >
          <Button onClick={handleSave} className="w-full gap-2">
            <Check className="h-4 w-4" />
            Enregistrer les préférences
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationPreferencesPanel;
