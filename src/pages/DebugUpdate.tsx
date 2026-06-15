import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUniversalUpdate } from '@/hooks/useUniversalUpdate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone, Globe, Download } from 'lucide-react';

export default function DebugUpdate() {
  const updateData = useUniversalUpdate();
  const [platformInfo, setPlatformInfo] = useState({
    isNative: false,
    platform: 'unknown',
    userAgent: ''
  });

  useEffect(() => {
    setPlatformInfo({
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent
    });
  }, []);

  const handleInstall = async () => {
    try {
      await updateData.installUpdate();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug - Système de mise à jour</h1>
        <p className="text-muted-foreground">
          Diagnostics détaillés du système de mise à jour universel
        </p>
      </div>

      <div className="space-y-6">
        {/* Informations Plateforme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Détection de la plateforme
            </CardTitle>
            <CardDescription>
              Informations sur l'environnement d'exécution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type d'application</span>
              <Badge variant={platformInfo.isNative ? 'default' : 'secondary'}>
                {platformInfo.isNative ? 'Application native' : 'Application web'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plateforme</span>
              <Badge variant="outline">{platformInfo.platform}</Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">User Agent:</span>
              <p className="text-muted-foreground mt-1 break-all text-xs">
                {platformInfo.userAgent}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* État de mise à jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              État de mise à jour
            </CardTitle>
            <CardDescription>
              Statut actuel des mises à jour disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mise à jour disponible</span>
              <Badge variant={updateData.updateAvailable ? 'destructive' : 'secondary'}>
                {updateData.updateAvailable ? 'Oui' : 'Non'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Afficher le prompt</span>
              <Badge variant={updateData.shouldShowPrompt ? 'default' : 'outline'}>
                {updateData.shouldShowPrompt ? 'Oui' : 'Non'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Installation en cours</span>
              <Badge variant={updateData.isUpdating ? 'default' : 'outline'}>
                {updateData.isUpdating ? 'Oui' : 'Non'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Détails version */}
        {updateData.updateInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informations de version
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
            {updateData.updateInfo.mobileInfo && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version actuelle</span>
                <Badge variant="outline">{updateData.updateInfo.mobileInfo.currentVersion}</Badge>
              </div>
            )}
            {updateData.updateInfo.version && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nouvelle version</span>
                <Badge variant="default">{updateData.updateInfo.version}</Badge>
              </div>
            )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plateforme détectée</span>
                <Badge variant="secondary">{updateData.updateInfo.platform}</Badge>
              </div>
              {updateData.updateInfo.severity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sévérité</span>
                  <Badge 
                    variant={
                      updateData.updateInfo.severity === 'major' ? 'destructive' :
                      updateData.updateInfo.severity === 'minor' ? 'default' : 'secondary'
                    }
                  >
                    {updateData.updateInfo.severity}
                  </Badge>
                </div>
              )}
              {updateData.updateInfo.changelog && updateData.updateInfo.changelog.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Changelog:</span>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {updateData.updateInfo.changelog.map((change, idx) => {
                      const changeText = typeof change === 'string' ? change : change.text;
                      const changeIcon = typeof change === 'string' ? '✨' : (change.icon || '✨');
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <span>{changeIcon}</span>
                          <span>{changeText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {updateData.updateAvailable && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleInstall} 
                disabled={updateData.isUpdating}
                className="w-full"
              >
                {updateData.isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Installation en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Installer la mise à jour
                  </>
                )}
              </Button>
              <Button 
                onClick={() => updateData.dismissUpdate()}
                variant="outline"
                className="w-full"
                disabled={updateData.isUpdating}
              >
                Reporter (24h)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info native update (si disponible) */}
        {updateData.updateInfo?.nativeUpdateAvailable && updateData.updateInfo?.mobileInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Détails mise à jour native</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Immediate update</span>
                <Badge variant={updateData.updateInfo.mobileInfo.immediateUpdateAllowed ? 'default' : 'outline'}>
                  {updateData.updateInfo.mobileInfo.immediateUpdateAllowed ? 'Oui' : 'Non'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Flexible update</span>
                <Badge variant={updateData.updateInfo.mobileInfo.flexibleUpdateAllowed ? 'default' : 'outline'}>
                  {updateData.updateInfo.mobileInfo.flexibleUpdateAllowed ? 'Oui' : 'Non'}
                </Badge>
              </div>
              {updateData.updateInfo.mobileInfo.availableVersion && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version code disponible</span>
                  <Badge variant="outline">{updateData.updateInfo.mobileInfo.availableVersion}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
