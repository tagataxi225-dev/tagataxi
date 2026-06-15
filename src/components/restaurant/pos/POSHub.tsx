import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Clock, 
  Receipt, 
  TrendingUp, 
  Play,
  Lock,
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  Gift
} from 'lucide-react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { usePOSSession, POSSession } from '@/hooks/usePOSSession';
import { usePOSTransactions } from '@/hooks/usePOSTransactions';
import { POSSessionManager } from './POSSessionManager';
import { POSSessionClose } from './POSSessionClose';
import { POSHistory } from './POSHistory';
import { ModernPOSLayout } from './ModernPOSLayout';

interface POSHubProps {
  restaurantId: string;
  isInTrial?: boolean;
  trialDaysRemaining?: number;
}

type HubView = 'dashboard' | 'pos' | 'close' | 'history';

export const POSHub = ({ restaurantId, isInTrial = false, trialDaysRemaining = 0 }: POSHubProps) => {
  const [view, setView] = useState<HubView>('dashboard');
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    cashSales: 0,
    mobileMoneySales: 0,
  });
  const [sessionHistory, setSessionHistory] = useState<POSSession[]>([]);

  const { currentSession, loading, getCurrentSession, getSessionHistory } = usePOSSession();
  const { getTodayTransactions } = usePOSTransactions();

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  const loadData = async () => {
    await getCurrentSession(restaurantId);
    
    // Load today's transactions
    const transactions = await getTodayTransactions(restaurantId);
    const stats = {
      totalSales: transactions.reduce((sum: number, t: any) => sum + t.total_amount, 0),
      transactionCount: transactions.length,
      cashSales: transactions.filter((t: any) => t.payment_method === 'cash').reduce((sum: number, t: any) => sum + t.total_amount, 0),
      mobileMoneySales: transactions.filter((t: any) => t.payment_method === 'mobile_money').reduce((sum: number, t: any) => sum + t.total_amount, 0),
    };
    setTodayStats(stats);

    // Load session history
    const history = await getSessionHistory(restaurantId, 5);
    setSessionHistory(history as POSSession[]);
  };

  const handleSessionOpened = () => {
    loadData();
    setView('pos');
  };

  const handleSessionClosed = () => {
    loadData();
    setView('dashboard');
  };

  // Render different views
  if (view === 'pos' && currentSession) {
    return (
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setView('dashboard')}
          className="absolute top-4 left-4 z-50"
        >
          ← Retour
        </Button>
        <ModernPOSLayout />
      </div>
    );
  }

  if (view === 'close' && currentSession) {
    return (
      <POSSessionClose 
        session={currentSession} 
        restaurantId={restaurantId}
        onClose={handleSessionClosed}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  if (view === 'history') {
    return (
      <POSHistory 
        restaurantId={restaurantId} 
        onBack={() => setView('dashboard')}
      />
    );
  }

  // handleRefresh moved to top with other hooks

  // Dashboard view
  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
    <div className="space-y-6">
      {/* Trial Banner */}
      {isInTrial && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Période d'essai gratuite</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''} pour tester la caisse Pro
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
            Essai
          </Badge>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Caisse</h1>
          <p className="text-muted-foreground">Gérez vos sessions et transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setView('history')}>
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventes du jour</p>
                <p className="text-lg font-bold">{todayStats.totalSales.toLocaleString()} CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{todayStats.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Espèces</p>
                <p className="text-lg font-bold">{todayStats.cashSales.toLocaleString()} CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mobile Money</p>
                <p className="text-lg font-bold">{todayStats.mobileMoneySales.toLocaleString()} CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Status Card */}
      <Card className={currentSession ? 'border-green-500/50 bg-green-500/5' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentSession ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Session de caisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Session active</p>
                  <p className="font-medium">#{currentSession.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Ouverte à</p>
                  <p className="font-medium">{new Date(currentSession.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Fond de caisse</p>
                  <p className="font-medium">{currentSession.opening_cash.toLocaleString()} CDF</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => setView('pos')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Accéder à la caisse
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setView('close')}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Fermer la session
                </Button>
              </div>
            </div>
          ) : (
            <POSSessionManager 
              restaurantId={restaurantId} 
              onSessionOpened={handleSessionOpened}
              compact 
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sessions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionHistory.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      session.cash_difference === 0 
                        ? 'bg-green-500/10' 
                        : session.cash_difference && session.cash_difference > 0 
                          ? 'bg-blue-500/10' 
                          : 'bg-red-500/10'
                    }`}>
                      {session.cash_difference === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : session.cash_difference && session.cash_difference > 0 ? (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(session.opened_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.total_transactions} ventes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{session.total_sales?.toLocaleString() || 0} CDF</p>
                    {session.cash_difference !== null && session.cash_difference !== 0 && (
                      <Badge variant={session.cash_difference > 0 ? 'default' : 'destructive'} className="text-xs">
                        {session.cash_difference > 0 ? '+' : ''}{session.cash_difference.toLocaleString()} CDF
                      </Badge>
                    )}
                    {session.cash_difference === 0 && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Équilibré
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </PullToRefresh>
  );
};
