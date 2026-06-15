import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowUpRight, Shield, Eye, Download } from 'lucide-react';
import { DeliveryConfirmationDialog } from '../escrow/DeliveryConfirmationDialog';
import { VaultTransactionDetails } from './VaultTransactionDetails';

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
  currency: string;
  status: string;
  held_at: string;
  released_at?: string;
  completed_at?: string;
  created_at: string;
  timeout_date?: string;
}

interface WalletInfo {
  balance: number;
  currency: string;
  pending_withdrawals: number;
  total_earned: number;
  total_withdrawn: number;
}

export const SecureVaultDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<SecureTransaction[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadVaultData();
    loadWalletInfo();
  }, []);

  const loadVaultData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Erreur chargement coffre:', error);
      toast({
        title: t('escrow.error_title'),
        description: t('escrow.error_load_vault'),
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

      // Calculer les statistiques
      const { data: transactions, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id);

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      const pendingAmount = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
      const totalEarned = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalWithdrawn = transactions?.filter(t => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setWalletInfo({
        balance: wallet?.balance || 0,
        currency: wallet?.currency || 'CDF',
        pending_withdrawals: pendingAmount,
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn
      });
    } catch (error: any) {
      console.error('Erreur chargement portefeuille:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'held': { variant: 'secondary', label: t('escrow.status_held'), icon: Shield },
      'completed': { variant: 'default', label: t('escrow.status_completed'), icon: CheckCircle },
      'disputed': { variant: 'destructive', label: t('escrow.status_disputed'), icon: AlertCircle },
      'refunded': { variant: 'outline', label: t('escrow.status_refunded'), icon: ArrowUpRight },
      'timeout': { variant: 'destructive', label: t('escrow.status_timeout'), icon: Clock }
    };

    const config = variants[status] || { variant: 'secondary', label: status, icon: Shield };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserRole = (transaction: SecureTransaction, userId: string) => {
    if (transaction.buyer_id === userId) return 'buyer';
    if (transaction.seller_id === userId) return 'seller';
    if (transaction.driver_id === userId) return 'driver';
    return 'unknown';
  };

  const handleConfirmDelivery = async (transactionId: string, confirmationData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('secure-vault-management', {
        body: {
          action: 'confirm_delivery',
          escrowId: transactionId,
          confirmationData
        }
      });

      if (error) throw error;

      toast({
        title: t('escrow.delivery_confirmed'),
        description: t('escrow.delivery_confirmed_desc')
      });

      loadVaultData();
      loadWalletInfo();
      setShowConfirmation(false);
    } catch (error: any) {
      console.error('Erreur confirmation:', error);
      toast({
        title: t('escrow.error_title'),
        description: error.message || t('escrow.error_confirmation'),
        variant: "destructive"
      });
    }
  };

  const exportTransactions = () => {
    const csv = transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Type: t.status,
      Montant: t.total_amount,
      Statut: t.status
    }));
    
    // Simple CSV export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Type,Montant,Statut\n"
      + csv.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "coffre-securise.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Résumé simple */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <Wallet className="h-6 w-6 text-success" />
              </div>
              <div>
                <h4 className="font-medium">{t('escrow.balance')}</h4>
                <p className="text-2xl font-bold text-success">
                  {walletInfo?.balance.toLocaleString()} {walletInfo?.currency || 'CDF'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('escrow.consultation_balance')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{t('escrow.secure_transactions')}</h4>
                <p className="text-2xl font-bold text-primary">
                  {transactions.filter(t => t.status === 'held').length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('escrow.pending_confirmation')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des transactions */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('escrow.all_tabs')}</TabsTrigger>
          <TabsTrigger value="held">{t('escrow.secured_tabs')}</TabsTrigger>
          <TabsTrigger value="completed">{t('escrow.released_tabs')}</TabsTrigger>
          <TabsTrigger value="pending">{t('escrow.pending_tabs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <SecureTransactionsList 
            transactions={transactions}
            onConfirmDelivery={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowConfirmation(true);
            }}
            onViewDetails={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowDetails(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>

        <TabsContent value="held" className="space-y-4">
          <SecureTransactionsList 
            transactions={transactions.filter(t => t.status === 'held')}
            onConfirmDelivery={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowConfirmation(true);
            }}
            onViewDetails={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowDetails(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <SecureTransactionsList 
            transactions={transactions.filter(t => t.status === 'completed')}
            onConfirmDelivery={() => {}}
            onViewDetails={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowDetails(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <SecureTransactionsList 
            transactions={transactions.filter(t => ['held', 'pending'].includes(t.status))}
            onConfirmDelivery={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowConfirmation(true);
            }}
            onViewDetails={(transactionId) => {
              setSelectedTransaction(transactionId);
              setShowDetails(true);
            }}
            getStatusBadge={getStatusBadge}
            getUserRole={getUserRole}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogues */}
      {selectedTransaction && (
        <>
          <DeliveryConfirmationDialog 
            open={showConfirmation}
            onOpenChange={setShowConfirmation}
            transactionId={selectedTransaction}
            onConfirm={handleConfirmDelivery}
          />
          
          <VaultTransactionDetails 
            open={showDetails}
            onOpenChange={setShowDetails}
            transactionId={selectedTransaction}
          />
        </>
      )}
    </div>
  );
};

interface SecureTransactionsListProps {
  transactions: SecureTransaction[];
  onConfirmDelivery: (transactionId: string) => void;
  onViewDetails: (transactionId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getUserRole: (transaction: SecureTransaction, userId: string) => string;
}

const SecureTransactionsList: React.FC<SecureTransactionsListProps> = ({
  transactions,
  onConfirmDelivery,
  onViewDetails,
  getStatusBadge,
  getUserRole
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { t } = useLanguage();

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
        const timeoutDate = transaction.timeout_date ? new Date(transaction.timeout_date) : null;
        const isNearTimeout = timeoutDate && timeoutDate.getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24h

        return (
          <Card key={transaction.id} className={`relative ${isNearTimeout ? 'border-warning' : ''}`}>
            {isNearTimeout && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('escrow.expires_soon')}
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Coffre #{transaction.order_id.slice(-8)}
                </CardTitle>
                {getStatusBadge(transaction.status)}
              </div>
              <CardDescription>
                Rôle: {userRole === 'buyer' ? '🛍️ ' + t('escrow.transaction_role_buyer') : userRole === 'seller' ? '🏪 ' + t('escrow.transaction_role_seller') : '🚚 ' + t('escrow.transaction_role_driver')} • 
                Sécurisé le {new Date(transaction.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('escrow.secured_amount')}</p>
                  <p className="font-semibold text-lg">{transaction.total_amount.toLocaleString()} {transaction.currency}</p>
                </div>
                
                {userRole === 'seller' && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('escrow.seller_earnings')} (80%)</p>
                    <p className="font-semibold text-success">
                      {transaction.seller_amount.toLocaleString()} {transaction.currency}
                    </p>
                  </div>
                )}
                
                {userRole === 'driver' && transaction.driver_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('escrow.delivery_fee')} (15%)</p>
                    <p className="font-semibold text-primary">
                      {transaction.driver_amount.toLocaleString()} {transaction.currency}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  onClick={() => onViewDetails(transaction.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('escrow.view_details')}
                </Button>
                
                {canConfirm && (
                  <Button 
                    onClick={() => onConfirmDelivery(transaction.id)}
                    className="flex-1"
                  >
                    🔓 {t('escrow.release_funds')}
                  </Button>
                )}
              </div>

              {transaction.completed_at && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {t('escrow.funds_released_on')} {new Date(transaction.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {timeoutDate && transaction.status === 'held' && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('escrow.auto_release_on')} {timeoutDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {transactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <Shield className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('escrow.no_transactions')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};