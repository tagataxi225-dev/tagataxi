import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeFinancialUpdates } from '@/hooks/useRealtimeFinancialUpdates';
import { 
  DollarSign, 
  TrendingUp, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Clock,
  Car,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const RealtimeFinancialWidget = () => {
  const { 
    updates, 
    totalCommissions, 
    totalCredits, 
    isConnected, 
    clearUpdates 
  } = useRealtimeFinancialUpdates();

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'commission':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'credit_transaction':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'wallet_update':
        return <Car className="h-4 w-4 text-orange-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'commission':
        return 'bg-green-50 border-green-200';
      case 'credit_transaction':
        return 'bg-blue-50 border-blue-200';
      case 'wallet_update':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatUpdateDescription = (update: any) => {
    switch (update.type) {
      case 'commission':
        return `Commission ${update.metadata.referenceType || 'service'}`;
      case 'credit_transaction':
        return `${update.metadata.transactionType === 'credit' ? 'Recharge' : 'Déduction'} crédit`;
      case 'wallet_update':
        return `Mise à jour portefeuille chauffeur`;
      default:
        return 'Transaction financière';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Connexion</CardTitle>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {updates.length} mises à jour
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Temps Réel</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              +{totalCommissions.toLocaleString()} CDF
            </div>
            <div className="text-xs text-muted-foreground">
              Commissions générées aujourd'hui
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédits Chauffeurs</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {totalCredits >= 0 ? '+' : ''}{totalCredits.toLocaleString()} CDF
            </div>
            <div className="text-xs text-muted-foreground">
              Mouvement crédits aujourd'hui
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Updates Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activité Financière Temps Réel
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearUpdates}
            disabled={updates.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              En attente d'activité financière...
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {updates.slice(0, 20).map((update, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getUpdateColor(update.type)} transition-all duration-200 hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getUpdateIcon(update.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {formatUpdateDescription(update)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(update.timestamp), 'HH:mm:ss', { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold text-sm ${
                        update.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {update.amount > 0 ? '+' : ''}{update.amount.toLocaleString()} {update.currency}
                      </div>
                      {update.metadata?.description && (
                        <div className="text-xs text-muted-foreground max-w-24 truncate">
                          {update.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};