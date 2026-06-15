import React from 'react';
import { AlertTriangle, Settings, MapPin, Search, Navigation, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { nativeGeolocationService, GeolocationError } from '@/services/nativeGeolocationService';

interface LocationErrorHandlerProps {
  error: string;
  errorType?: string;
  onRetry: () => void;
  onManualLocation: () => void;
  onSearchAddress: () => void;
  loading?: boolean;
}

export const LocationErrorHandler = ({
  error,
  errorType,
  onRetry,
  onManualLocation,
  onSearchAddress,
  loading = false
}: LocationErrorHandlerProps) => {
  const { t } = useLanguage();
  const guidance = nativeGeolocationService.getSettingsGuidance();

  const getErrorContent = () => {
    // Permission denied / blocked
    if (errorType === 'permission_denied' || errorType === 'permission_denied_permanent' || error.includes('Permission') || error.includes('bloquée') || error.includes('refusée')) {
      return {
        icon: <Settings className="h-10 w-10 text-orange-500" />,
        title: 'Localisation bloquée',
        description: error || 'La permission de localisation est désactivée.',
        steps: guidance.detailedSteps,
        actions: [
          { label: '🔄 Réessayer', action: onRetry, variant: 'default' as const },
          { label: '📍 Saisir une adresse', action: onSearchAddress, variant: 'outline' as const },
          { label: '🗺️ Choisir sur la carte', action: onManualLocation, variant: 'outline' as const }
        ],
        showOpenSettings: nativeGeolocationService.isNativePlatform()
      };
    }

    // Services disabled (GPS off)
    if (errorType === 'services_disabled' || error.includes('désactivé') || error.includes('disabled')) {
      return {
        icon: <Smartphone className="h-10 w-10 text-red-500" />,
        title: 'GPS désactivé',
        description: 'Le service de localisation est désactivé sur votre appareil.',
        steps: [
          'Ouvrez les Réglages/Paramètres de votre téléphone',
          'Activez le Service de localisation / GPS',
          'Revenez sur Tembea et appuyez sur Réessayer'
        ],
        actions: [
          { label: '🔄 Réessayer', action: onRetry, variant: 'default' as const },
          { label: '📍 Saisir une adresse', action: onSearchAddress, variant: 'outline' as const }
        ],
        showOpenSettings: nativeGeolocationService.isNativePlatform()
      };
    }

    // HTTPS required
    if (error.includes('HTTPS') || error.includes('sécurisée')) {
      return {
        icon: <AlertTriangle className="h-10 w-10 text-red-500" />,
        title: 'Connexion non sécurisée',
        description: 'La géolocalisation nécessite une connexion HTTPS.',
        steps: [],
        actions: [
          { label: '📍 Saisir une adresse', action: onSearchAddress, variant: 'default' as const },
          { label: '🗺️ Choisir sur la carte', action: onManualLocation, variant: 'outline' as const }
        ],
        showOpenSettings: false
      };
    }

    // Timeout
    if (errorType === 'timeout' || error.includes('timeout') || error.includes('trop de temps')) {
      return {
        icon: <RefreshCw className="h-10 w-10 text-amber-500" />,
        title: 'GPS trop lent',
        description: 'Le GPS met du temps à trouver votre position. Essayez dans un endroit plus ouvert.',
        steps: [],
        actions: [
          { label: '🔄 Réessayer', action: onRetry, variant: 'default' as const },
          { label: '📍 Saisir une adresse', action: onSearchAddress, variant: 'outline' as const },
          { label: '🗺️ Choisir sur la carte', action: onManualLocation, variant: 'outline' as const }
        ],
        showOpenSettings: false
      };
    }

    // Generic / position unavailable
    return {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: 'Position indisponible',
      description: error || 'Impossible d\'obtenir votre position. Choisissez une alternative.',
      steps: [],
      actions: [
        { label: '🔄 Réessayer', action: onRetry, variant: 'default' as const },
        { label: '📍 Saisir une adresse', action: onSearchAddress, variant: 'outline' as const },
        { label: '🗺️ Choisir sur la carte', action: onManualLocation, variant: 'outline' as const }
      ],
      showOpenSettings: false
    };
  };

  const content = getErrorContent();

  const handleOpenSettings = async () => {
    const opened = await nativeGeolocationService.openAppSettings();
    if (opened) {
      // ✅ Auto-retry après retour des paramètres Android/iOS
      // L'utilisateur revient après ~2-5s, on retente automatiquement
      setTimeout(() => {
        console.log('📍 [GPS] Auto-retry after returning from settings...');
        onRetry();
      }, 4000);
    }
  };

  return (
    <Card className="mx-4 my-4 border-border/60 shadow-lg">
      <CardContent className="p-5 text-center space-y-3">
        <div className="flex justify-center">
          {content.icon}
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Étapes détaillées de résolution */}
        {content.steps && content.steps.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 text-left space-y-1.5">
            <p className="text-xs font-medium text-foreground">Comment résoudre :</p>
            {content.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-xs font-bold text-primary mt-0.5">{idx + 1}.</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bouton Ouvrir les réglages (natif uniquement) */}
        {content.showOpenSettings && (
          <Button variant="secondary" onClick={handleOpenSettings} className="w-full gap-2" size="sm">
            <Settings className="h-4 w-4" /> Ouvrir les Réglages
          </Button>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {content.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              disabled={loading && index === 0}
              className="w-full"
              size="sm"
            >
              {loading && index === 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Recherche GPS...
                </div>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
