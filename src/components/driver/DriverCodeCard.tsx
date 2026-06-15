import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, RefreshCw, QrCode } from 'lucide-react';
import { useDriverCode } from '@/hooks/useDriverCode';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface DriverCodeCardProps {
  compact?: boolean;
  showQRCode?: boolean;
}

export const DriverCodeCard: React.FC<DriverCodeCardProps> = ({ 
  compact = false,
  showQRCode = true 
}) => {
  const { 
    loading, 
    driverCode, 
    partnerAssignment,
    generateCode, 
    regenerateCode,
    copyCode,
    shareCode
  } = useDriverCode();

  if (!driverCode) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className={compact ? 'p-4' : 'p-6'}>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Générer votre Code Driver
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ce code permet de rejoindre une flotte ou parrainer d'autres chauffeurs
            </p>
            <Button 
              onClick={generateCode} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Génération...' : 'Générer mon code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className={compact ? 'p-4' : 'p-6'}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">Code Driver</span>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                partnerAssignment 
                  ? 'text-amber-600 border-amber-300 bg-amber-50' 
                  : 'text-green-600 border-green-300 bg-green-50'
              }`}
            >
              {partnerAssignment ? '🔗 Assigné' : '✓ Disponible'}
            </Badge>
          </div>

          {/* Code Display */}
          <div className={`bg-card rounded-xl border border-border/50 ${compact ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${showQRCode && !compact ? 'flex-row items-center gap-6' : 'flex-col items-center'}`}>
              {/* QR Code */}
              {showQRCode && (
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QRCodeSVG 
                      value={driverCode.code}
                      size={compact ? 80 : 120}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              )}

              {/* Code Text */}
              <div className={`${showQRCode && !compact ? 'text-left' : 'text-center mt-4'} flex-1`}>
                <p className="text-xs text-muted-foreground mb-1">Votre code unique</p>
                <p className={`font-mono font-bold text-primary tracking-[0.3em] ${compact ? 'text-xl' : 'text-3xl'}`}>
                  {driverCode.code}
                </p>
                {partnerAssignment && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Assigné à {partnerAssignment.partner_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-4`}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyCode}
              className="h-10"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={shareCode}
              className="h-10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            {!compact && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={regenerateCode}
                disabled={loading || !!partnerAssignment}
                className="h-10"
                title={partnerAssignment ? 'Quittez la flotte pour régénérer' : 'Régénérer le code'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Nouveau
              </Button>
            )}
          </div>

          {/* Helper text */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Partagez ce code pour rejoindre une flotte ou parrainer des chauffeurs
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
