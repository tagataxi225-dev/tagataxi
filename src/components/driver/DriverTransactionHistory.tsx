import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowUpIcon, ArrowDownIcon, RefreshCw, Download, Filter, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatCurrency';
interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  payment_method?: string;
  reference_type?: string;
  reference_id?: string;
  balance_after: number;
  created_at: string;
  metadata?: {
    commission_breakdown?: {
      total_amount?: number;
      driver_amount_gross?: number;
      partner_amount?: number;
      driver_amount_net?: number;
      admin_amount?: number;
      platform_amount?: number;
    };
    commission_rates?: {
      driver?: number;
      partner?: number;
    };
  };
}

export const DriverTransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    search: ''
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filter.type !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filter.type);
    }

    if (filter.status !== 'all') {
      filtered = filtered.filter(t => t.status === filter.status);
    }

    if (filter.search) {
      filtered = filtered.filter(t =>
        (t.description ?? '').toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    if (filter.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filter.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.created_at) >= filterDate);
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <ArrowUpIcon className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const formatAmount = (amount: number, currency: string = 'CDF') => formatCurrency(amount, 'CDF');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Montant', 'Description', 'Statut', 'Solde après'].join(','),
      ...filteredTransactions.map(t => [
        formatDate(t.created_at),
        t.transaction_type === 'credit' ? 'Crédit' : 'Débit',
        t.amount,
        t.description,
        t.status,
        t.balance_after
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalCredits = filteredTransactions
    .filter(t => t.transaction_type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDebits = filteredTransactions
    .filter(t => t.transaction_type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-3 border rounded bg-muted/30 text-sm text-muted-foreground">
        Gains des courses (portefeuille) — distincts des recharges de crédits.
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total crédits</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatAmount(totalCredits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownIcon className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total débits</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatAmount(totalDebits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice net</p>
                <p className="text-lg font-semibold">
                  {formatAmount(totalCredits - totalDebits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={loadTransactions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
            
            <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="credit">Crédits</SelectItem>
                <SelectItem value="debit">Débits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.dateRange} onValueChange={(value) => setFilter({ ...filter, dateRange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Historique complet ({filteredTransactions.length} transactions)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune transaction trouvée
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                          {transaction.payment_method && (
                            <span className="ml-2">via {transaction.payment_method}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount, transaction.currency)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Solde: {formatAmount(transaction.balance_after, transaction.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commission breakdown for earnings */}
                  {transaction.transaction_type === 'credit' && 
                   transaction.metadata?.commission_breakdown && (
                    <div className="px-4 pb-4 border-t bg-muted/20">
                      <div className="pt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Détail des frais:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>Prix total course:</span>
                            <span className="font-medium">
                              {formatAmount(transaction.metadata.commission_breakdown.total_amount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Part chauffeur brute:</span>
                            <span className="font-medium">
                              {formatAmount(transaction.metadata.commission_breakdown.driver_amount_gross || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>- Frais Tembea:</span>
                            <span className="font-medium">
                              -{formatAmount((transaction.metadata.commission_breakdown.admin_amount || 0) + 
                                            (transaction.metadata.commission_breakdown.platform_amount || 0))}
                            </span>
                          </div>
                          {(transaction.metadata.commission_breakdown.partner_amount || 0) > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>- Frais partenaire ({transaction.metadata.commission_rates?.partner || 0}%):</span>
                              <span className="font-medium">
                                -{formatAmount(transaction.metadata.commission_breakdown.partner_amount || 0)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-green-600 font-semibold border-t pt-1">
                            <span>Montant net reçu:</span>
                            <span>
                              {formatAmount(transaction.metadata.commission_breakdown.driver_amount_net || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};