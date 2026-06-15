/**
 * 🟢 Toggle Online/Offline Moderne avec garde-fous éligibilité
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Power, MapPin, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { useDriverEligibility } from '@/hooks/useDriverEligibility';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

interface ModernOnlineToggleProps {
  className?: string;
}

export const ModernOnlineToggle: React.FC<ModernOnlineToggleProps> = ({ className }) => {
  const { status, loading, goOnline, goOffline } = useDriverStatus();
  const { location, getCurrentPosition, loading: gpsLoading } = useDriverGeolocation({ autoSync: false });
  const eligibility = useDriverEligibility();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [onlineTime, setOnlineTime] = useState<Date | null>(null);

  const getOnlineDuration = () => {
    if (!onlineTime || !status.isOnline) return null;
    const diff = Date.now() - onlineTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const handleToggle = async () => {
    setUpdating(true);
    
    try {
      if (!status.isOnline) {
        let currentLocation = location;
        try {
          currentLocation = await getCurrentPosition();
        } catch {
          setUpdating(false);
          return;
        }

        if (!currentLocation) {
          setUpdating(false);
          return;
        }

        const success = await goOnline(currentLocation.latitude, currentLocation.longitude);
        
        if (success) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7']
          });
          
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          
          setOnlineTime(new Date());
        }
      } else {
        const success = await goOffline();
        if (success) {
          setOnlineTime(null);
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  const isLoading = loading || updating || gpsLoading || eligibility.loading;
  const duration = getOnlineDuration();
  const canGoOnline = eligibility.isEligible;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Bouton principal */}
      <Button
        onClick={handleToggle}
        disabled={isLoading || (!status.isOnline && !canGoOnline)}
        className={cn(
          "w-full h-16 text-xl font-bold shadow-2xl transition-all duration-300 relative overflow-hidden",
          status.isOnline 
            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
            : canGoOnline
              ? "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white"
              : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {status.isOnline && (
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
        )}
        
        <div className="relative flex items-center justify-center gap-3">
          {status.isOnline ? (
            <>
              <Wifi className="h-8 w-8 animate-pulse" />
              <span>EN LIGNE - Prêt à recevoir</span>
            </>
          ) : !canGoOnline ? (
            <>
              <ShieldAlert className="h-7 w-7" />
              <span className="text-base">Conditions requises</span>
            </>
          ) : (
            <>
              <Power className="h-8 w-8" />
              <span>HORS LIGNE - Appuyez pour vous connecter</span>
            </>
          )}
        </div>
      </Button>

      {/* Badge durée en ligne */}
      {status.isOnline && duration && (
        <div className="flex items-center justify-center gap-2">
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            En ligne depuis {duration}
          </Badge>
        </div>
      )}

      {/* Indicateur GPS */}
      {status.isOnline && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location ? (
            <span className="text-green-600 font-medium">GPS actif</span>
          ) : (
            <span className="text-yellow-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              GPS en attente...
            </span>
          )}
        </div>
      )}

      {/* Alertes d'éligibilité */}
      {!status.isOnline && !eligibility.loading && eligibility.blockedReasons.length > 0 && (
        <div className="space-y-2">
          {eligibility.blockedReasons.map((reason) => (
            <div
              key={reason.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-sm text-destructive truncate">{reason.message}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs text-primary font-semibold gap-1"
                onClick={() => navigate(reason.actionRoute)}
              >
                {reason.actionLabel}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Partenaire actif */}
      {!status.isOnline && eligibility.hasPartner && eligibility.partnerName && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Partenaire : {eligibility.partnerName}
          </Badge>
        </div>
      )}
    </div>
  );
};
