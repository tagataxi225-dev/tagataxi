import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Wallet } from 'lucide-react';
import { useRestaurantWallet } from '@/hooks/useRestaurantWallet';
import { RestaurantWalletCard } from '@/components/restaurant/RestaurantWalletCard';
import { RestaurantTopUpDialog } from '@/components/restaurant/RestaurantTopUpDialog';
import { RestaurantWithdrawalCard } from '@/components/restaurant/RestaurantWithdrawalCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

export default function RestaurantWalletPage() {
  const navigate = useNavigate();
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const { wallet, transactions, loading, topUpWallet, topUpLoading, formatAmount, getMonthlyStats, refetch: refreshWallet } = useRestaurantWallet();

  const monthlyStats = getMonthlyStats();

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const handleRefresh = useCallback(async () => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
      <div className="space-y-6 pb-24 md:pb-6 max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/restaurant')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">TAGAPay</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gérez vos finances restaurant</p>
          </div>
        </div>

        {/* Wallet Card */}
        <RestaurantWalletCard
          balance={wallet?.balance || 0}
          bonusBalance={wallet?.bonus_balance || 0}
          monthlySpent={monthlyStats.spent}
          monthlyRecharged={monthlyStats.recharged}
          onRecharge={() => setTopUpDialogOpen(true)}
          loading={loading}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total rechargé</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{monthlyStats.recharged.toLocaleString()} CDF</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total dépensé</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{monthlyStats.spent.toLocaleString()} CDF</span>
                <ArrowDownRight className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Transactions ce mois</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {transactions.filter(t => {
                    const txDate = new Date(t.created_at);
                    const now = new Date();
                    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Gestion financière</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transactions">
              <TabsList className="mb-4">
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="withdrawal" className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  Retrait
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucune transaction</div>
                ) : (
                  transactions.map((tx) => (
                    <Card key={tx.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.transaction_type === 'credit' ? <ArrowUpRight className="h-5 w-5 text-green-600" /> : <ArrowDownRight className="h-5 w-5 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(tx.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getTransactionColor(tx.transaction_type)}`}>
                            {tx.transaction_type === 'credit' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} CDF
                          </p>
                          <Badge variant={getStatusBadge(tx.status)} className="text-xs">
                            {{ completed: 'Terminé', pending: 'En attente', failed: 'Échoué' }[tx.status] || tx.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="withdrawal">
                <RestaurantWithdrawalCard />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <RestaurantTopUpDialog
          open={topUpDialogOpen}
          onOpenChange={setTopUpDialogOpen}
          currentBalance={wallet?.balance || 0}
          onSuccess={() => {}}
          onTopUp={async (amount, method, phone) => {
            await topUpWallet({ amount, payment_method: method as any, phone_number: phone });
          }}
          loading={topUpLoading}
        />
      </div>
    </PullToRefresh>
  );
}
