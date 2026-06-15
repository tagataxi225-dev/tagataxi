import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QRChannel, generateTrackedUrl } from '@/utils/qrCodeUtils';

interface QRChannelCardProps {
  channel: QRChannel;
  onDownload: (channelId: string) => void;
}

export const QRChannelCard = ({ channel, onDownload }: QRChannelCardProps) => {
  const trackedUrl = generateTrackedUrl(channel);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader style={{ backgroundColor: `${channel.color}15` }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{channel.name}</CardTitle>
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: channel.color }}
          />
        </div>
        <CardDescription className="text-sm">{channel.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          {/* QR Code Preview */}
          <div className="bg-white p-4 rounded-lg border-2 border-border">
            <QRCodeSVG
              id={`qr-${channel.id}`}
              value={trackedUrl}
              size={180}
              level="H"
              includeMargin
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Statistiques */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="text-center">
              <div className="font-semibold text-foreground">UTM</div>
              <div className="truncate">{channel.utmSource}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">Canal</div>
              <div className="truncate">{channel.utmMedium}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => onDownload(channel.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              PNG
            </Button>
            <Button
              onClick={() => window.open(trackedUrl, '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Tester
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
