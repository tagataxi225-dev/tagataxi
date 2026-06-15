import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, XCircle, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrangeMoneyStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  processingTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  averageProcessingTime: number;
}

interface RecentTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: any;
}

export const OrangeMoneyMonitoring = () => {
  const [stats, setStats] = useState<OrangeMoneyStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    processingTransactions: 0,
    totalAmount: 0,
    averageAmount: 0,
    successRate: 0,
    averageProcessingTime: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('today');
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<RecentTransaction | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadStats = async () => {
    try {
      const now = new Date();
      let since: Date;
      
      switch (timeRange) {
        case 'today':
          since = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          since = new Date(yesterday.setHours(0, 0, 0, 0));
          break;
        case '7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Récupérer toutes les transactions Orange Money
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_provider', 'orange')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (transactions) {
        const successful = transactions.filter(t => t.status === 'completed');
        const failed = transactions.filter(t => t.status === 'failed');
        const processing = transactions.filter(t => t.status === 'processing');
        const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        // Calculer temps moyen de traitement
        const completedWithTime = successful.filter((t: any) => 
          t.metadata && t.metadata.completed_at && t.created_at
        );
        const averageTime = completedWithTime.length > 0
          ? completedWithTime.reduce((sum: number, t: any) => {
              const start = new Date(t.created_at).getTime();
              const end = new Date(t.metadata.completed_at).getTime();
              return sum + (end - start);
            }, 0) / completedWithTime.length
          : 0;

        setStats({
          totalTransactions: transactions.length,
          successfulTransactions: successful.length,
          failedTransactions: failed.length,
          processingTransactions: processing.length,
          totalAmount,
          averageAmount: transactions.length > 0 ? totalAmount / transactions.length : 0,
          successRate: transactions.length > 0 ? (successful.length / transactions.length) * 100 : 0,
          averageProcessingTime: averageTime / 1000 // en secondes
        });

        setRecentTransactions(transactions.slice(0, 10) as RecentTransaction[]);
        
        // Préparer les données pour les graphiques
        const dailyData: Record<string, { date: string; successful: number; failed: number; total: number }> = {};
        transactions.forEach(t => {
          const date = format(new Date(t.created_at), 'dd/MM', { locale: fr });
          if (!dailyData[date]) {
            dailyData[date] = { date, successful: 0, failed: 0, total: 0 };
          }
          dailyData[date].total++;
          if (t.status === 'completed') dailyData[date].successful++;
          if (t.status === 'failed') dailyData[date].failed++;
        });
        setChartData(Object.values(dailyData).reverse());
      }
    } catch (error) {
      console.error('Error loading Orange Money stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}min ${Math.round(seconds % 60)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary'
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status === 'completed' ? 'Réussi' : status === 'failed' ? 'Échoué' : 'En cours'}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Montant', 'Devise', 'Statut', 'User ID', 'Orange TxnID'];
    const rows = recentTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString('fr-FR'),
      tx.transaction_id,
      tx.amount.toString(),
      tx.currency,
      tx.status,
      tx.user_id,
      tx.metadata?.orange_txnid || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orange_money_${timeRange}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Orange Money</h2>
          <p className="text-muted-foreground">
            Statistiques et transactions en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex gap-2">
            {(['today', 'yesterday', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {range === 'today' ? "Aujourd'hui" : range === 'yesterday' ? 'Hier' : range === '7d' ? '7 jours' : '30 jours'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Montant total: {formatAmount(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <TrendingUp className={`h-4 w-4 ${stats.successRate >= 90 ? 'text-green-500' : 'text-orange-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <Progress value={stats.successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulTransactions} réussies / {stats.totalTransactions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(stats.averageProcessingTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Traitement des paiements réussis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.processingTransactions > 5 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedTransactions} échouées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert si taux d'échec élevé */}
      {stats.successRate < 85 && stats.totalTransactions > 10 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-orange-700 dark:text-orange-400">
                Taux de succès faible détecté
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              Le taux de succès est de {stats.successRate.toFixed(1)}%, ce qui est inférieur au seuil recommandé de 85%.
              Vérifiez les logs des edge functions et contactez Orange si nécessaire.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      {chartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des transactions</CardTitle>
              <CardDescription>Transactions réussies vs échouées</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="successful" stroke="hsl(var(--chart-2))" name="Réussies" strokeWidth={2} />
                  <Line type="monotone" dataKey="failed" stroke="hsl(var(--chart-1))" name="Échouées" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume quotidien</CardTitle>
              <CardDescription>Nombre total de transactions par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions récentes</CardTitle>
          <CardDescription>Les 10 dernières transactions Orange Money</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setSelectedTransaction(tx)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(tx.status)}
                  <div>
                    <div className="font-mono text-sm">{tx.transaction_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{formatAmount(tx.amount)}</div>
                    {tx.metadata?.orange_txnid && (
                      <div className="text-xs text-muted-foreground">
                        Orange: {tx.metadata.orange_txnid}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog détails transaction */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTransaction(null)}>
          <Card className="max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Détails de la transaction</CardTitle>
              <CardDescription>{selectedTransaction.transaction_id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <div className="font-semibold mt-1">{formatAmount(selectedTransaction.amount)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de création</Label>
                  <div className="text-sm mt-1">{new Date(selectedTransaction.created_at).toLocaleString('fr-FR')}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dernière mise à jour</Label>
                  <div className="text-sm mt-1">{new Date(selectedTransaction.updated_at).toLocaleString('fr-FR')}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="text-sm font-mono mt-1">{selectedTransaction.user_id}</div>
                </div>
                {selectedTransaction.metadata?.orange_txnid && (
                  <div>
                    <Label className="text-muted-foreground">Orange Transaction ID</Label>
                    <div className="text-sm font-mono mt-1">{selectedTransaction.metadata.orange_txnid}</div>
                  </div>
                )}
              </div>
              
              {selectedTransaction.metadata && (
                <div>
                  <Label className="text-muted-foreground">Métadonnées complètes</Label>
                  <pre className="text-xs bg-muted p-3 rounded-lg mt-2 overflow-auto max-h-40">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              <Button onClick={() => setSelectedTransaction(null)} className="w-full">
                Fermer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
