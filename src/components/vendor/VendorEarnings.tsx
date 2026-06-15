import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVendorWallet } from '@/hooks/useVendorWallet';
import { TrendingUp, Wallet, ArrowUpRight, Clock } from 'lucide-react';

export const VendorEarnings = () => {
  const { wallet, transactions, loading, formatAmount } = useVendorWallet();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const salesTransactions = transactions.filter(t => t.transaction_type === 'sale');
  const completedSales = salesTransactions.filter(t => t.status === 'completed');
  const pendingSales = salesTransactions.filter(t => t.status === 'pending');

  const totalEarned = completedSales.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPending = pendingSales.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Solde disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(wallet?.balance || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Peut être retiré
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenus totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalEarned.toLocaleString()} CDF</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completedSales.length} ventes complétées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{totalPending.toLocaleString()} CDF</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingSales.length} ventes en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {salesTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100' 
                        : 'bg-orange-100'
                    }`}>
                      {transaction.status === 'completed' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.status === 'completed' 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                    }`}>
                      +{formatAmount(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.status === 'completed' ? 'Complétée' : 'En attente'}
                    </p>
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
