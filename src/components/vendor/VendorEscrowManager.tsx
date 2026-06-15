import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ArrowDownCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EscrowTransaction {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'released' | 'cancelled';
  created_at: string;
  released_at?: string;
  order?: {
    product?: {
      title: string;
    };
    buyer_phone?: string;
  };
}

export const VendorEscrowManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ pending: 0, released: 0, total: 0 });

  useEffect(() => {
    if (user) {
      loadEscrowData();
    }
  }, [user]);

  const loadEscrowData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les transactions escrow (utiliser marketplace_orders avec escrow status)
      const { data: escrowData, error: escrowError } = await supabase
        .from('marketplace_orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          completed_at,
          product:marketplace_products(title),
          buyer_phone
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (escrowError) throw escrowError;

      // Transformer les données
      const transformedTransactions: EscrowTransaction[] = (escrowData || []).map((order: any) => ({
        id: order.id,
        order_id: order.id,
        amount: Number(order.total_amount),
        status: order.status === 'completed' ? 'released' : 
                order.status === 'cancelled' ? 'cancelled' : 'pending',
        created_at: order.created_at,
        released_at: order.completed_at,
        order: {
          product: { title: order.product?.title || 'Produit' },
          buyer_phone: order.buyer_phone
        }
      }));

      setTransactions(transformedTransactions);

      // Calculer les soldes
      const pending = transformedTransactions.filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const released = transformedTransactions.filter(t => t.status === 'released')
        .reduce((sum, t) => sum + t.amount, 0);

      setBalance({
        pending,
        released,
        total: pending + released
      });

    } catch (error) {
      console.error('Error loading escrow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données escrow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        variant: 'secondary' as const, 
        label: 'En attente', 
        icon: Clock 
      },
      released: { 
        variant: 'default' as const, 
        label: 'Libéré', 
        icon: CheckCircle 
      },
      cancelled: { 
        variant: 'destructive' as const, 
        label: 'Annulé', 
        icon: AlertCircle 
      }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted/60 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {balance.pending.toLocaleString()} CDF
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Libéré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {balance.released.toLocaleString()} CDF
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {balance.total.toLocaleString()} CDF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Comment fonctionne l'escrow ?</p>
              <p>Les paiements des clients sont sécurisés en escrow. Les fonds sont automatiquement libérés sur votre wallet vendeur lorsque vous terminez une commande.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5" />
            Historique des transactions ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {transaction.order?.product?.title || 'Produit'}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Client: {transaction.order?.buyer_phone || 'Non renseigné'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(transaction.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      transaction.status === 'released' 
                        ? 'text-green-600' 
                        : transaction.status === 'cancelled'
                        ? 'text-destructive'
                        : 'text-yellow-600'
                    }`}>
                      {Number(transaction.amount).toLocaleString()} CDF
                    </p>
                    {transaction.released_at && (
                      <p className="text-xs text-muted-foreground">
                        Libéré {formatDistanceToNow(new Date(transaction.released_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    )}
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
