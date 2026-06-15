import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, ArrowUpRight, Clock } from 'lucide-react';
import { useVendorEscrow } from '@/hooks/useVendorEscrow';

export const VendorEscrow = () => {
  const { escrowTransactions, merchantAccount, loading } = useVendorEscrow();

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mes revenus sécurisés</h1>

      {/* Solde disponible */}
      <Card className="border-2 border-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-4xl font-bold text-green-600">
                {(merchantAccount?.balance || 0).toLocaleString()} CDF
              </p>
            </div>
            <Button size="lg">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Retirer mes fonds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions escrow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paiements sécurisés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {escrowTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune transaction</p>
          ) : (
            escrowTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Commande #{transaction.order_id?.slice(-8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{(transaction.seller_amount || 0).toLocaleString()} CDF</p>
                  <Badge variant={transaction.status === 'held' ? 'secondary' : 'default'}>
                    {transaction.status === 'held' ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </>
                    ) : (
                      '✓ Libéré'
                    )}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
