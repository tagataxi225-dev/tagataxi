import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, CreditCard, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  transaction_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Handle empty data gracefully - this is NOT an error
      if (!data || data.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      
      // Only show error toast for actual errors (network, database), not empty results
      if (error instanceof Error && !error.message.includes('No rows')) {
        toast({
          title: "Erreur",
          description: "Impossible de charger l'historique des transactions",
          variant: "destructive",
        });
      }
      
      // Set empty array on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'pending':
        return <RotateCcw className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency === 'CDF' ? 'CDF' : 'USD',
      minimumFractionDigits: currency === 'CDF' ? 0 : 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-CD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getProviderName = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'airtel':
        return 'Airtel Money';
      case 'orange':
        return 'Orange Money';
      case 'mpesa':
        return 'M-Pesa';
      default:
        return provider;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 animate-spin" />
            <span>Chargement des transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </span>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>{getProviderName(transaction.payment_provider)}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(transaction.created_at)}</span>
                    </div>
                    {transaction.transaction_id && (
                      <div className="text-xs text-muted-foreground">
                        ID: {transaction.transaction_id}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {transactions.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={loadTransactions}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;