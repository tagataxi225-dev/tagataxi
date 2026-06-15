import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, QrCode, TrendingUp } from 'lucide-react';
import { QRChannelCard } from '@/components/marketing/QRChannelCard';
import { QRCodeGenerator } from '@/components/marketing/QRCodeGenerator';
import { DISTRIBUTION_CHANNELS } from '@/utils/qrCodeUtils';
import { useToast } from '@/hooks/use-toast';

export default function QRCodeManager() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSingle = (channelId: string) => {
    const canvas = document.getElementById(`qr-${channelId}`) as HTMLCanvasElement;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `kwenda-qr-${channelId}.png`;
    link.href = dataUrl;
    link.click();

    toast({
      title: "QR Code téléchargé",
      description: `Canal: ${DISTRIBUTION_CHANNELS.find(c => c.id === channelId)?.name}`,
    });
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    
    // Simuler un téléchargement groupé
    for (const channel of DISTRIBUTION_CHANNELS.slice(0, 3)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      handleDownloadSingle(channel.id);
    }

    setDownloading(false);
    
    toast({
      title: "Téléchargement terminé",
      description: `${DISTRIBUTION_CHANNELS.length} QR codes téléchargés`,
    });
  };

  const categories = [
    { id: 'all', label: 'Tous les canaux', channels: DISTRIBUTION_CHANNELS },
    { id: 'social', label: 'Réseaux sociaux', channels: DISTRIBUTION_CHANNELS.filter(c => c.utmMedium === 'social' || c.utmMedium === 'messaging') },
    { id: 'print', label: 'Marketing physique', channels: DISTRIBUTION_CHANNELS.filter(c => c.utmMedium === 'print' || c.utmMedium === 'outdoor') },
    { id: 'partners', label: 'Partenaires', channels: DISTRIBUTION_CHANNELS.filter(c => c.utmMedium === 'referral') },
    { id: 'events', label: 'Événements', channels: DISTRIBUTION_CHANNELS.filter(c => c.utmSource === 'event') },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de QR Codes</h1>
          <p className="text-muted-foreground mt-1">
            Téléchargez et gérez vos QR codes marketing avec tracking UTM
          </p>
        </div>
        <Button onClick={handleDownloadAll} disabled={downloading}>
          <Download className="w-4 h-4 mr-2" />
          {downloading ? 'Téléchargement...' : 'Télécharger tout'}
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total canaux</CardTitle>
            <QrCode className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DISTRIBUTION_CHANNELS.length}</div>
            <p className="text-xs text-muted-foreground">QR codes disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <p className="text-xs text-muted-foreground">Types de canaux</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formats</CardTitle>
            <Download className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PNG, SVG</div>
            <p className="text-xs text-muted-foreground">Haute résolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canaux prédéfinis</TabsTrigger>
          <TabsTrigger value="custom">QR personnalisé</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.label} ({cat.channels.length})
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(cat => (
              <TabsContent key={cat.id} value={cat.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cat.channels.map(channel => (
                    <QRChannelCard
                      key={channel.id}
                      channel={channel}
                      onDownload={handleDownloadSingle}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="custom">
          <div className="max-w-xl mx-auto">
            <QRCodeGenerator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
