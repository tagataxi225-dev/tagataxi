import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useDriverWallet } from '@/hooks/useDriverWallet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const WalletPanel: React.FC = () => {
  const { balance, transactions, isLoading, currency } = useDriverWallet();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solde actuel */}
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5" />
            <span className="text-sm opacity-90">Solde disponible</span>
          </div>
          <div className="text-4xl font-bold mb-4">
            {balance.toLocaleString()} {currency}
          </div>
          <Button 
            variant="secondary" 
            className="w-full bg-white text-green-600 hover:bg-white/90"
            onClick={() => {}}
          >
            <Plus className="h-4 w-4 mr-2" />
            Recharger mon wallet
          </Button>
        </CardContent>
      </Card>

      {/* Résumé de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Cette semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Reçu</p>
              <p className="text-xl font-bold text-green-600">
                {transactions
                  .filter(t => t.transaction_type === 'credit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()} {currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dépensé</p>
              <p className="text-xl font-bold text-red-600">
                {transactions
                  .filter(t => t.transaction_type === 'debit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()} {currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Historique des transactions */}
      <div>
        <h3 className="font-semibold mb-4">Dernières transactions</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Aucune transaction récente
              </CardContent>
            </Card>
          ) : (
            transactions.slice(0, 10).map((transaction) => (
              <Card key={transaction.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'credit' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} {currency}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status === 'completed' ? 'Complété' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
