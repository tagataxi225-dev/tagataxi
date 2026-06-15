import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Check, Clock, AlertTriangle, Package, CreditCard, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SecureTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  total_amount: number;
  seller_amount: number;
  driver_amount?: number;
  platform_fee: number;
  status: string;
  currency: string;
  created_at: string;
  completed_at?: string;
  marketplace_orders?: {
    id: string;
    product_name: string;
    seller_name: string;
    buyer_name: string;
    status: string;
  };
}

interface WalletInfo {
  balance: number;
  currency: string;
  pending_withdrawals: number;
}

export const SecureVaultDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<SecureTransaction[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          marketplace_orders!inner (
            id,
            product_name,
            seller_name,
            buyer_name,
            status
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions Coffre sécurisé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du Coffre sécurisé",
        variant: "destructive"
      });
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet, error } = await supabase
        .from('user_wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .eq('currency', 'CDF')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setWalletInfo({
        balance: wallet?.balance || 0,
        currency: 'CDF',
        pending_withdrawals: 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement du wallet:', error);
    }
  };

  const confirmDelivery = async (escrowId: string) => {
    try {
      setConfirmingDelivery(escrowId);
      
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'confirmDeliveryAndRelease',
          escrow_id: escrowId
        }
      });

      if (error) throw error;

      toast({
        title: t('escrow.delivery_confirmed'),
        description: t('escrow.delivery_confirmed_desc')
      });

      await fetchTransactions();
      await fetchWalletInfo();
    } catch (error: any) {
      console.error('Erreur lors de la confirmation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la livraison",
        variant: "destructive"
      });
    } finally {
      setConfirmingDelivery(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'held':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="mr-1 h-3 w-3" />Terminé</Badge>;
      case 'disputed':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Litige</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserRole = (transaction: SecureTransaction, userId: string) => {
    if (transaction.buyer_id === userId) return 'buyer';
    if (transaction.seller_id === userId) return 'seller';
    if (transaction.driver_id === userId) return 'driver';
    return 'unknown';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount).replace('CDF', 'CDF');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchWalletInfo()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Coffre sécurisé</h1>
          <p className="text-muted-foreground">Protection des paiements et transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Solde TembeaPay</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {walletInfo ? formatAmount(walletInfo.balance) : '0 CDF'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Transactions protégées</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {transactions.filter(t => t.status === 'held').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Transactions du Coffre sécurisé</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="held">En attente</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune transaction trouvée dans votre Coffre sécurisé
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => {
                    const userRole = getUserRole(transaction, currentUserId || '');
                    return (
                      <Card key={transaction.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <Package className="h-5 w-5 text-primary" />
                              <span className="font-medium">
                                {transaction.marketplace_orders?.product_name || 'Produit'}
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Commande:</strong> #{transaction.order_id.slice(0, 8)}</p>
                              <p><strong>Votre rôle:</strong> {
                                userRole === 'buyer' ? 'Acheteur' :
                                userRole === 'seller' ? 'Vendeur' :
                                userRole === 'driver' ? 'Livreur' : 'Inconnu'
                              }</p>
                              <p><strong>Date:</strong> {new Date(transaction.created_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            <p className="text-lg font-bold">
                              {formatAmount(transaction.total_amount)}
                            </p>
                            
                            {transaction.status === 'held' && userRole === 'buyer' && (
                              <Button
                                size="sm"
                                onClick={() => confirmDelivery(transaction.id)}
                                disabled={confirmingDelivery === transaction.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                {confirmingDelivery === transaction.id ? 'Confirmation...' : 'Confirmer réception'}
                              </Button>
                            )}
                            
                            {transaction.status === 'held' && userRole === 'seller' && (
                              <p className="text-sm text-amber-600 flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                En attente confirmation acheteur
                              </p>
                            )}
                            
                            {transaction.status === 'held' && userRole === 'driver' && (
                              <p className="text-sm text-blue-600 flex items-center">
                                <Truck className="mr-1 h-3 w-3" />
                                Livraison en cours
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Breakdown des montants */}
                        <div className="mt-3 pt-3 border-t bg-muted/30 rounded p-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Vendeur</p>
                              <p className="font-medium">{formatAmount(transaction.seller_amount)}</p>
                            </div>
                            {transaction.driver_amount && (
                              <div>
                                <p className="text-muted-foreground">Livreur</p>
                                <p className="font-medium">{formatAmount(transaction.driver_amount)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Frais Tembea</p>
                              <p className="font-medium">{formatAmount(transaction.platform_fee)}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="held" className="space-y-4 mt-4">
              <div className="space-y-4">
                {transactions.filter(t => t.status === 'held').map((transaction) => {
                  const userRole = getUserRole(transaction, currentUserId || '');
                  return (
                    <Card key={transaction.id} className="p-4 border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium">
                              {transaction.marketplace_orders?.product_name || 'Produit'}
                            </span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Clock className="mr-1 h-3 w-3" />En attente
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p><strong>Commande:</strong> #{transaction.order_id.slice(0, 8)}</p>
                            <p><strong>Votre rôle:</strong> {
                              userRole === 'buyer' ? 'Acheteur' :
                              userRole === 'seller' ? 'Vendeur' :
                              userRole === 'driver' ? 'Livreur' : 'Inconnu'
                            }</p>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <p className="text-lg font-bold text-yellow-600">
                            {formatAmount(transaction.total_amount)}
                          </p>
                          
                          {userRole === 'buyer' && (
                            <Button
                              size="sm"
                              onClick={() => confirmDelivery(transaction.id)}
                              disabled={confirmingDelivery === transaction.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {confirmingDelivery === transaction.id ? 'Confirmation...' : 'Confirmer réception'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4 mt-4">
              <div className="space-y-4">
                {transactions.filter(t => t.status === 'completed').map((transaction) => (
                  <Card key={transaction.id} className="p-4 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-green-600" />
                          <span className="font-medium">
                            {transaction.marketplace_orders?.product_name || 'Produit'}
                          </span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Check className="mr-1 h-3 w-3" />Terminé
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Commande:</strong> #{transaction.order_id.slice(0, 8)}</p>
                          <p><strong>Terminé le:</strong> {
                            transaction.completed_at ? 
                            new Date(transaction.completed_at).toLocaleDateString('fr-FR') : 
                            'Date inconnue'
                          }</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatAmount(transaction.total_amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};