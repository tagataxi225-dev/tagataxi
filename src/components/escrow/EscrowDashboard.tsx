import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { WithdrawalDialog } from './WithdrawalDialog';
import { DeliveryConfirmationDialog } from './DeliveryConfirmationDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface EscrowTransaction {
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
}

interface WalletInfo {
  balance: number;
  currency: string;
  pending_withdrawals: number;
}

export const EscrowDashboard: React.FC = () => {
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadEscrowData();
    loadWalletInfo();
  }, []);

  const loadEscrowData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEscrowTransactions(data || []);
    } catch (error: any) {
      console.error('Erreur chargement escrow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données escrow",
        variant: "destructive"
      });
    }
  };

  const loadWalletInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger le portefeuille
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .eq('currency', 'CDF')
        .single();

      // Charger les retraits en attente
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      const pendingAmount = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

      setWalletInfo({
        balance: wallet?.balance || 0,
        currency: wallet?.currency || 'CDF',
        pending_withdrawals: pendingAmount
      });
    } catch (error: any) {
      console.error('Erreur chargement portefeuille:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'held': { variant: 'secondary', label: 'En attente', icon: Clock },
      'completed': { variant: 'default', label: 'Terminé', icon: CheckCircle },
      'disputed': { variant: 'destructive', label: 'Litige', icon: AlertCircle },
      'refunded': { variant: 'outline', label: 'Remboursé', icon: ArrowUpRight }
    };

    const config = variants[status] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserRole = (transaction: EscrowTransaction, userId: string) => {
    if (transaction.buyer_id === userId) return 'buyer';
    if (transaction.seller_id === userId) return 'seller';
    if (transaction.driver_id === userId) return 'driver';
    return 'unknown';
  };

  const handleConfirmDelivery = async (escrowId: string, confirmationData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'confirm_delivery',
          escrowId,
          confirmationData
        }
      });

      if (error) throw error;

      toast({
        title: t('escrow.delivery_confirmed'),
        description: t('escrow.delivery_confirmed_desc')
      });

      loadEscrowData();
      loadWalletInfo();
      setShowConfirmation(false);
    } catch (error: any) {
      console.error('Erreur confirmation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la confirmation",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec portefeuille */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde disponible</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletInfo?.balance.toLocaleString()} {walletInfo?.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponible pour retrait
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retraits en cours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletInfo?.pending_withdrawals.toLocaleString()} {walletInfo?.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              En traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setShowWithdrawal(true)}
              className="w-full"
              disabled={!walletInfo?.balance || walletInfo.balance <= 0}
            >
              Retirer des fonds
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des transactions */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="held">En attente</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <EscrowTransactionsList 
            transactions={escrowTransactions}
            onConfirmDelivery={(escrowId) => {
              setSelectedEscrow(escrowId);
              setShowConfirmation(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>

        <TabsContent value="held" className="space-y-4">
          <EscrowTransactionsList 
            transactions={escrowTransactions.filter(t => t.status === 'held')}
            onConfirmDelivery={(escrowId) => {
              setSelectedEscrow(escrowId);
              setShowConfirmation(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <EscrowTransactionsList 
            transactions={escrowTransactions.filter(t => t.status === 'completed')}
            onConfirmDelivery={() => {}}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogues */}
      <WithdrawalDialog 
        open={showWithdrawal}
        onOpenChange={setShowWithdrawal}
        availableBalance={walletInfo?.balance || 0}
        onSuccess={() => {
          loadWalletInfo();
          setShowWithdrawal(false);
        }}
      />

      {selectedEscrow && (
        <DeliveryConfirmationDialog 
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          transactionId={selectedEscrow}
          onConfirm={handleConfirmDelivery}
        />
      )}
    </div>
  );
};

interface EscrowTransactionsListProps {
  transactions: EscrowTransaction[];
  onConfirmDelivery: (escrowId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getUserRole: (transaction: EscrowTransaction, userId: string) => string;
}

const EscrowTransactionsList: React.FC<EscrowTransactionsListProps> = ({
  transactions,
  onConfirmDelivery,
  getStatusBadge,
  getUserRole
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  if (!currentUserId) return null;

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const userRole = getUserRole(transaction, currentUserId);
        const canConfirm = userRole === 'buyer' && transaction.status === 'held';

        return (
          <Card key={transaction.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Transaction #{transaction.order_id.slice(-8)}
                </CardTitle>
                {getStatusBadge(transaction.status)}
              </div>
              <CardDescription>
                Rôle: {userRole === 'buyer' ? 'Acheteur' : userRole === 'seller' ? 'Vendeur' : 'Livreur'} • 
                Créé le {new Date(transaction.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-semibold">{transaction.total_amount.toLocaleString()} {transaction.currency}</p>
                </div>
                
                {userRole === 'seller' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Votre part</p>
                    <p className="font-semibold text-green-600">
                      {transaction.seller_amount.toLocaleString()} {transaction.currency}
                    </p>
                  </div>
                )}
                
                {userRole === 'driver' && transaction.driver_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Frais de livraison</p>
                    <p className="font-semibold text-blue-600">
                      {transaction.driver_amount.toLocaleString()} {transaction.currency}
                    </p>
                  </div>
                )}
              </div>

              {canConfirm && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={() => onConfirmDelivery(transaction.id)}
                    className="w-full"
                  >
                    Confirmer la réception
                  </Button>
                </div>
              )}

              {transaction.completed_at && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-green-600">
                    ✓ Terminé le {new Date(transaction.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {transactions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Aucune transaction trouvée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};