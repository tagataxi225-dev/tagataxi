import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign, AlertTriangle, TrendingUp, X } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil } from '@/utils/formatCurrency';
interface RideCompletionData {
  totalAmount: number;
  driverAmountGross: number;
  driverAmountNet: number;
  kwendaFees: number;
  partnerFees?: number;
  partnerRate?: number;
  serviceType: 'transport' | 'delivery';
  rideId: string;
}

interface RideCompletionNotificationProps {
  data: RideCompletionData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RideCompletionNotification: React.FC<RideCompletionNotificationProps> = ({
  data,
  isOpen,
  onClose
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, 'CDF');

  if (!data) return null;

  const kwendaRate = ((data.kwendaFees / data.totalAmount) * 100);
  const hasPartnerFees = (data.partnerFees || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>{data.serviceType === 'transport' ? 'Course' : 'Livraison'} Terminée!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main earnings display */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <p className="text-sm text-green-700">Vous recevez</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.driverAmountNet)}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Ajouté à votre portefeuille
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Prix total</p>
              <p className="font-semibold">{formatCurrency(data.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frais prélevés</p>
              <p className="font-semibold text-red-600">
                -{formatCurrency(data.kwendaFees + (data.partnerFees || 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Votre part</p>
              <p className="font-semibold text-green-600">
                {((data.driverAmountNet / data.totalAmount) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Details toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            {showDetails ? 'Masquer' : 'Voir'} le détail des frais
          </Button>

          {/* Detailed breakdown */}
          {showDetails && (
            <Card className="border-orange-200">
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix total de la {data.serviceType === 'transport' ? 'course' : 'livraison'}:</span>
                    <span className="font-medium">{formatCurrency(data.totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Part chauffeur brute:</span>
                    <span className="font-medium">{formatCurrency(data.driverAmountGross)}</span>
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between items-center text-red-600">
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Frais Tembea:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">-{formatCurrency(data.kwendaFees)}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {kwendaRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {hasPartnerFees && (
                      <div className="flex justify-between items-center text-orange-600">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Frais partenaire:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">-{formatCurrency(data.partnerFees!)}</span>
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {data.partnerRate?.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-semibold text-green-600">
                      <span>Montant net reçu:</span>
                      <span>{formatCurrency(data.driverAmountNet)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button onClick={onClose} className="flex-1">
              Continuer
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tip */}
          <div className="text-xs text-center text-muted-foreground bg-muted/30 p-2 rounded">
            💡 Consultez votre historique de transactions pour plus de détails
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};