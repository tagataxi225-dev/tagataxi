/**
 * 🔔 Toggle pour activer/désactiver les notifications Tembea Job
 * Composant réutilisable pour les préférences utilisateur
 */

import React, { useState, useEffect } from 'react';
import { Briefcase, Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { saveJobNotificationPrefs } from '@/hooks/useJobNotifications.tsx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface JobNotificationToggleProps {
  className?: string;
  showCard?: boolean;
}

export const JobNotificationToggle: React.FC<JobNotificationToggleProps> = ({
  className,
  showCard = true
}) => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Charger les préférences sauvegardées
    try {
      const stored = localStorage.getItem('job_notification_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        setEnabled(prefs.enabled ?? true);
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    saveJobNotificationPrefs({ enabled: checked });
    
    toast.success(
      checked 
        ? '🔔 Notifications Tembea Job activées' 
        : '🔕 Notifications Tembea Job désactivées',
      { duration: 2000 }
    );
  };

  const content = (
    <div className={cn("flex items-center justify-between", !showCard && className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl",
          enabled ? "bg-primary/10" : "bg-muted"
        )}>
          {enabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <Label htmlFor="job-notifications" className="font-medium cursor-pointer">
            Tembea Job
          </Label>
          <p className="text-xs text-muted-foreground">
            Nouvelles offres d'emploi
          </p>
        </div>
      </div>
      <Switch
        id="job-notifications"
        checked={enabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );

  if (!showCard) return content;

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="pt-4">
        {content}
      </CardContent>
    </Card>
  );
};

export default JobNotificationToggle;
