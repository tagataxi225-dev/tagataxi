import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  User, 
  Package, 
  Truck,
  Calendar,
  DollarSign
} from 'lucide-react';
import UniversalTracker from '@/components/tracking/UniversalTracker';

interface VaultTransactionDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
}

interface TransactionDetail {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  total_amount: number;
  seller_amount: number;
  driver_amount?: number;
  platform_fee: number;
  currency: string;
  status: string;
  held_at: string;
  released_at?: string;
  completed_at?: string;
  created_at: string;
  timeout_date?: string;
  confirmation_code?: string;
  marketplace_orders?: {
    product_name: string;
    quantity: number;
    unit_price: number;
  } | null;
}

export const VaultTransactionDetails: React.FC<VaultTransactionDetailsProps> = ({
  open,
  onOpenChange,
  transactionId
}) => {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (open && transactionId) {
      loadTransactionDetails();
    }
  }, [open, transactionId]);

  const loadTransactionDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      
      // Récupérer séparément les détails de la commande marketplace si elle existe
      let marketplaceOrder = null;
      if (data?.order_id) {
        const { data: orderData } = await supabase
          .from('marketplace_orders')
          .select('product_name, quantity, unit_price')
          .eq('id', data.order_id)
          .maybeSingle();
        
        marketplaceOrder = orderData;
      }

      setTransaction({
        ...data,
        marketplace_orders: marketplaceOrder
      } as TransactionDetail);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'held': Shield,
      'completed': CheckCircle,
      'disputed': AlertCircle,
      'refunded': ArrowUpRight,
      'timeout': Clock
    };
    return icons[status] || Shield;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'held': 'text-primary',
      'completed': 'text-success',
      'disputed': 'text-destructive',
      'refunded': 'text-muted-foreground',
      'timeout': 'text-warning'
    };
    return colors[status] || 'text-primary';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!transaction) return null;

  const StatusIcon = getStatusIcon(transaction.status);
  const timeoutDate = transaction.timeout_date ? new Date(transaction.timeout_date) : null;
  const isNearTimeout = timeoutDate && timeoutDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('escrow.vault_transaction_id')}{transaction.order_id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Détails complets de la transaction sécurisée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut et alerte timeout */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={transaction.status === 'completed' ? 'default' : 'secondary'} 
              className="flex items-center gap-2"
            >
              <StatusIcon className={`h-4 w-4 ${getStatusColor(transaction.status)}`} />
              {t(`escrow.status_${transaction.status}`)}
            </Badge>
            
            {isNearTimeout && (
              <Badge variant="destructive" className="animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                {t('escrow.expires_soon')}
              </Badge>
            )}
          </div>

          {/* Informations produit */}
          {transaction.marketplace_orders && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Produit commandé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{transaction.marketplace_orders.product_name}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Quantité: {transaction.marketplace_orders.quantity}</span>
                    <span>Prix unitaire: {transaction.marketplace_orders.unit_price.toLocaleString()} {transaction.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Répartition des montants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Répartition des montants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="font-medium">Montant total sécurisé</span>
                  <span className="text-lg font-bold text-primary">
                    {transaction.total_amount.toLocaleString()} {transaction.currency}
                  </span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      Vendeur (80%)
                    </span>
                    <span className="font-semibold text-success">
                      {transaction.seller_amount.toLocaleString()} {transaction.currency}
                    </span>
                  </div>

                  {transaction.driver_amount && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4" />
                        Livreur (15%)
                      </span>
                      <span className="font-semibold text-primary">
                        {transaction.driver_amount.toLocaleString()} {transaction.currency}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4" />
                      Commission Tembea (5%)
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      {transaction.platform_fee.toLocaleString()} {transaction.currency}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline des événements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Chronologie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Transaction créée</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 bg-warning rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Fonds sécurisés</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.held_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {transaction.completed_at && (
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                    <div className="h-2 w-2 bg-success rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Fonds libérés</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {timeoutDate && transaction.status === 'held' && (
                  <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                    <div className="h-2 w-2 bg-warning rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-medium">Libération automatique prévue</p>
                      <p className="text-sm text-muted-foreground">
                        {timeoutDate.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Code de confirmation si disponible */}
          {transaction.confirmation_code && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Code de confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg font-mono text-center text-lg font-bold">
                  {transaction.confirmation_code}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking compact si livraison associée */}
          {transaction.order_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Suivi de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UniversalTracker 
                  orderId={transaction.order_id}
                  compact={true}
                  showMap={false}
                  showChat={false}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};