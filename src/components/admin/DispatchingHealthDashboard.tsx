import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DispatchingStats {
  totalAttempts: number;
  successRate: number;
  failuresByReason: Record<string, number>;
  driversWithZeroCredits: number;
  avgMatchTime: number;
  last24hStats: {
    success: number;
    failed: number;
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export const DispatchingHealthDashboard: React.FC = () => {
  const [stats, setStats] = useState<DispatchingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // 1. Récupérer tous les logs de dispatching
      const { data: logs, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .in('activity_type', ['ride_dispatch_success', 'ride_dispatch_failed'])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      // 2. Récupérer les chauffeurs avec 0 crédits
      const { data: driversWithZeroCredits, error: driversError } = await supabase
        .from('driver_subscriptions')
        .select('driver_id')
        .eq('rides_remaining', 0)
        .eq('status', 'active');

      if (driversError) throw driversError;

      // 3. Analyser les logs
      const totalAttempts = logs?.length || 0;
      const successCount = logs?.filter(l => l.activity_type === 'ride_dispatch_success').length || 0;
      const failedLogs = logs?.filter(l => l.activity_type === 'ride_dispatch_failed') || [];

      // Grouper les échecs par raison
      const failuresByReason: Record<string, number> = {};
      failedLogs.forEach(log => {
        const reason = (log.metadata as any)?.reason || 'unknown';
        failuresByReason[reason] = (failuresByReason[reason] || 0) + 1;
      });

      // Stats des dernières 24h
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = logs?.filter(l => new Date(l.created_at) > last24h) || [];
      const last24hSuccess = recent.filter(l => l.activity_type === 'ride_dispatch_success').length;
      const last24hFailed = recent.filter(l => l.activity_type === 'ride_dispatch_failed').length;

      setStats({
        totalAttempts,
        successRate: totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0,
        failuresByReason,
        driversWithZeroCredits: driversWithZeroCredits?.length || 0,
        avgMatchTime: 0, // TODO: Calculer depuis les logs
        last24hStats: {
          success: last24hSuccess,
          failed: last24hFailed
        }
      });

    } catch (error) {
      console.error('Erreur chargement stats dispatching:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.successRate;
  const isHealthy = successRate >= 80;
  const isWarning = successRate >= 50 && successRate < 80;
  const isCritical = successRate < 50;

  // Préparer les données pour les graphiques
  const reasonsData = Object.entries(stats.failuresByReason).map(([reason, count]) => ({
    name: reason === 'no_rides_remaining' ? 'Pas de crédits' : reason,
    value: count
  }));

  const last24hData = [
    { name: 'Succès', value: stats.last24hStats.success, fill: '#10b981' },
    { name: 'Échecs', value: stats.last24hStats.failed, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de santé */}
      <Card className={`
        ${isHealthy ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : ''}
        ${isWarning ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20' : ''}
        ${isCritical ? 'border-red-500/50 bg-red-50 dark:bg-red-950/20' : ''}
      `}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Santé du Dispatching</span>
            <Badge 
              variant={isHealthy ? 'default' : isWarning ? 'secondary' : 'destructive'}
              className="text-sm"
            >
              {isHealthy && <CheckCircle className="h-4 w-4 mr-1" />}
              {isWarning && <AlertCircle className="h-4 w-4 mr-1" />}
              {isCritical && <XCircle className="h-4 w-4 mr-1" />}
              {successRate.toFixed(1)}% succès
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total (7 jours)</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalAttempts}</p>
              <p className="text-xs text-muted-foreground mt-1">tentatives</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Dernières 24h</p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-bold text-green-600">
                    {stats.last24hStats.success}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-bold text-red-600">
                    {stats.last24hStats.failed}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Chauffeurs</p>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                <span className="text-3xl font-bold text-orange-600">
                  {stats.driversWithZeroCredits}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">sans crédits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raisons des échecs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raisons des échecs (7 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {reasonsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reasonsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun échec enregistré</p>
            )}
          </CardContent>
        </Card>

        {/* Performance 24h */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance dernières 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last24hData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {last24hData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques */}
      {isCritical && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alerte critique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">
              Le taux de succès du dispatching est inférieur à 50%. Actions recommandées :
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
              <li>Vérifier la disponibilité des chauffeurs</li>
              <li>Contacter les chauffeurs sans crédits ({stats.driversWithZeroCredits})</li>
              <li>Élargir les zones de recherche</li>
              <li>Vérifier les logs des edge functions</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
