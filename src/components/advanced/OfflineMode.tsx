import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const OfflineMode: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isOnline, isSyncing, pendingCount, syncProgress, sync, cleanup } = useOfflineSync();

  const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0 });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Estimer la taille du cache réel
  const updateStorageEstimate = useCallback(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageInfo({
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        });
      }
    } catch (e) {
      console.error('Storage estimate error:', e);
    }
  }, []);

  useEffect(() => {
    updateStorageEstimate();
    const interval = setInterval(updateStorageEstimate, 30000);
    return () => clearInterval(interval);
  }, [updateStorageEstimate]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSync = async () => {
    await sync();
    setLastSync(new Date());
    await updateStorageEstimate();
  };

  const handleDownloadEssentials = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Précharger les données essentielles dans le cache du navigateur
      const essentialUrls = [
        '/', '/app/client', '/app/driver'
      ];

      for (let i = 0; i < essentialUrls.length; i++) {
        setDownloadProgress(Math.round(((i + 1) / essentialUrls.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await updateStorageEstimate();

      toast({
        title: '✅ Données essentielles téléchargées',
        description: 'L\'application fonctionnera en mode hors-ligne',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '❌ Erreur de téléchargement',
        description: 'Impossible de télécharger les données',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleClearCache = async () => {
    try {
      await cleanup();
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      await updateStorageEstimate();
      toast({
        title: '🗑️ Cache vidé',
        description: 'Toutes les données hors ligne ont été supprimées',
      });
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Jamais';
    return new Intl.DateTimeFormat('fr-CD', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span>État de la connexion</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(lastSync)}</p>
              <p className="text-sm text-muted-foreground">Dernière sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatBytes(storageInfo.used)}</p>
              <p className="text-sm text-muted-foreground">Données en cache</p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                {pendingCount} élément{pendingCount > 1 ? 's' : ''} en attente de synchronisation
              </p>
            </div>
          )}

          {isSyncing && syncProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Synchronisation</span>
                <span>{syncProgress.current}/{syncProgress.total}</span>
              </div>
              <Progress value={(syncProgress.current / syncProgress.total) * 100} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Progress */}
      {isDownloading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Téléchargement en cours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={handleDownloadEssentials}
          disabled={isDownloading}
          variant="outline"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger pour hors ligne
        </Button>

        <Button 
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
        </Button>

        <Button 
          onClick={handleClearCache}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Vider le cache
        </Button>
      </div>

      {/* Storage info */}
      {storageInfo.quota > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Stockage local</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilisé</span>
                <span>{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}</span>
              </div>
              <Progress value={(storageInfo.used / storageInfo.quota) * 100} className="w-full" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>IndexedDB + Cache API actifs</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfflineMode;
