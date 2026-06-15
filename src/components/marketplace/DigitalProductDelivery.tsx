import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileCode, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DigitalProductDeliveryProps {
  orderId: string;
  productName: string;
  fileName: string;
  fileSize: number;
}

export const DigitalProductDelivery: React.FC<DigitalProductDeliveryProps> = ({
  orderId,
  productName,
  fileName,
  fileSize
}) => {
  const { toast } = useToast();
  const [downloadInfo, setDownloadInfo] = useState<{
    download_count: number;
    max_downloads: number;
    download_token: string;
    expires_at: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    const fetchDownloadInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_digital_downloads')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (error) throw error;
        setDownloadInfo(data);
      } catch (error) {
        console.error('Error fetching download info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloadInfo();
  }, [orderId]);

  const handleDownload = async () => {
    if (!downloadInfo) return;

    // Vérifier limites
    if (downloadInfo.download_count >= downloadInfo.max_downloads) {
      toast({
        variant: 'destructive',
        title: 'Limite atteinte',
        description: 'Vous avez épuisé vos téléchargements pour ce produit'
      });
      return;
    }

    // Vérifier expiration
    if (new Date(downloadInfo.expires_at) < new Date()) {
      toast({
        variant: 'destructive',
        title: 'Lien expiré',
        description: 'Ce lien de téléchargement a expiré'
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Appeler l'edge function pour téléchargement sécurisé
      const { data, error } = await supabase.functions.invoke('digital-download', {
        body: { token: downloadInfo.download_token }
      });

      if (error) throw error;

      // Simuler progression
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Télécharger le fichier
      const response = await fetch(data.downloadUrl);
      const blob = await response.blob();
      
      // Créer le lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Mettre à jour le compteur local
      setDownloadInfo(prev => prev ? {
        ...prev,
        download_count: prev.download_count + 1
      } : null);

      toast({
        title: 'Téléchargement réussi ! 🎉',
        description: `${fileName} a été téléchargé`
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de téléchargement',
        description: error.message || 'Impossible de télécharger le fichier'
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!downloadInfo) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-destructive">Téléchargement non disponible</h3>
              <p className="text-sm text-muted-foreground">
                Les informations de téléchargement n'ont pas été trouvées
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remainingDownloads = downloadInfo.max_downloads - downloadInfo.download_count;
  const isExpired = new Date(downloadInfo.expires_at) < new Date();
  const canDownload = remainingDownloads > 0 && !isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={canDownload 
        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
        : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200"
      }>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCode className={canDownload ? "h-5 w-5 text-green-600" : "h-5 w-5 text-muted-foreground"} />
            Votre achat digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Infos produit */}
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
              canDownload 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-gray-100 dark:bg-gray-800"
            }`}>
              {canDownload ? (
                <Download className="h-7 w-7 text-green-600" />
              ) : (
                <AlertCircle className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${canDownload ? "text-green-900 dark:text-green-100" : "text-muted-foreground"}`}>
                {canDownload ? 'Votre achat est prêt ! 🎉' : 'Téléchargements épuisés'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {fileName} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>

          {/* Stats de téléchargement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Téléchargements</p>
                <p className="font-semibold">
                  {downloadInfo.download_count} / {downloadInfo.max_downloads}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Expire</p>
                <p className="font-semibold text-sm">
                  {isExpired 
                    ? 'Expiré' 
                    : formatDistanceToNow(new Date(downloadInfo.expires_at), { locale: fr, addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar des téléchargements restants */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Téléchargements restants</span>
              <span>{remainingDownloads} restant(s)</span>
            </div>
            <Progress 
              value={(remainingDownloads / downloadInfo.max_downloads) * 100} 
              className="h-2"
            />
          </div>

          {/* Bouton de téléchargement */}
          {canDownload ? (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Téléchargement... {downloadProgress}%
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Télécharger maintenant
                </>
              )}
            </Button>
          ) : (
            <Button 
              className="w-full"
              size="lg"
              variant="secondary"
              disabled
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {isExpired ? 'Lien expiré' : 'Limite de téléchargements atteinte'}
            </Button>
          )}

          {/* Badges de sécurité */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Téléchargement sécurisé</span>
            </div>
            {canDownload && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Valide encore {formatDistanceToNow(new Date(downloadInfo.expires_at), { locale: fr })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
