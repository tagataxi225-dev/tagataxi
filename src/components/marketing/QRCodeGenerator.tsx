import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const QRCodeGenerator = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('https://tembea.app/install');
  const [size, setSize] = useState(512);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const canvas = document.getElementById('qr-generator') as HTMLCanvasElement;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `kwenda-qr-custom-${size}px.png`;
    link.href = dataUrl;
    link.click();

    toast({
      title: "QR Code téléchargé",
      description: `Format PNG ${size}x${size}px`,
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "URL copiée",
      description: "L'URL a été copiée dans le presse-papiers",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générateur de QR Code personnalisé</CardTitle>
        <CardDescription>
          Créez un QR code avec une URL personnalisée
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">URL de destination</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tembea.app/install?utm_source=custom"
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <Label htmlFor="size">Taille du QR Code</Label>
            <Select value={size.toString()} onValueChange={(v) => setSize(Number(v))}>
              <SelectTrigger id="size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256">256x256 (Web petit)</SelectItem>
                <SelectItem value="512">512x512 (Recommandé)</SelectItem>
                <SelectItem value="1024">1024x1024 (Haute qualité)</SelectItem>
                <SelectItem value="2048">2048x2048 (Impression)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-6 rounded-lg border-2 border-border">
            <QRCodeSVG
              id="qr-generator"
              value={url}
              size={Math.min(size, 300)}
              level="H"
              includeMargin
            />
          </div>

          <Button onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Télécharger ({size}x{size} PNG)
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>Astuce :</strong> Ajoutez des paramètres UTM à votre URL pour tracker
          les scans dans le dashboard analytics (utm_source, utm_medium, utm_campaign).
        </div>
      </CardContent>
    </Card>
  );
};
