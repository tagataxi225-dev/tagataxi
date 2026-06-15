/**
 * 📊 DASHBOARD DE PERFORMANCE - MODE DEV SEULEMENT
 * Affiche les métriques React Query, Network, Session
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Zap, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PerformanceDashboard = () => {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    totalQueries: 0,
    cachedQueries: 0,
    fetchingQueries: 0,
    staleQueries: 0,
    cacheHitRatio: 0,
    avgQueryTime: 0
  });

  // Calculer les métriques React Query
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();

      const totalQueries = queries.length;
      const cachedQueries = queries.filter(q => q.state.data !== undefined).length;
      const fetchingQueries = queries.filter(q => q.state.fetchStatus === 'fetching').length;
      const staleQueries = queries.filter(q => q.isStale()).length;

      const cacheHitRatio = totalQueries > 0 
        ? Math.round((cachedQueries / totalQueries) * 100) 
        : 0;

      setMetrics({
        totalQueries,
        cachedQueries,
        fetchingQueries,
        staleQueries,
        cacheHitRatio,
        avgQueryTime: 0 // TODO: Calculer avec des timestamps
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, queryClient]);

  // Détection Ctrl+Shift+P pour toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Seulement en mode développement
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Bouton flottant pour ouvrir */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 z-[999] bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
          onClick={() => setIsVisible(true)}
          title="Performance Dashboard (Ctrl+Shift+P)"
        >
          <Activity className="w-5 h-5" />
        </motion.button>
      )}

      {/* Dashboard */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-[999] w-96 max-h-[600px] overflow-auto"
          >
            <Card className="p-4 bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">Performance</h3>
                  <Badge variant="outline" className="text-xs">DEV</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* React Query Metrics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>React Query</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Total Queries"
                    value={metrics.totalQueries}
                    icon="🗄️"
                  />
                  <MetricCard
                    label="En Cache"
                    value={metrics.cachedQueries}
                    icon="💾"
                    color="green"
                  />
                  <MetricCard
                    label="Fetching"
                    value={metrics.fetchingQueries}
                    icon="⏳"
                    color={metrics.fetchingQueries > 0 ? 'yellow' : 'gray'}
                  />
                  <MetricCard
                    label="Stale"
                    value={metrics.staleQueries}
                    icon="🔄"
                    color={metrics.staleQueries > 5 ? 'orange' : 'gray'}
                  />
                </div>

                {/* Cache Hit Ratio */}
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">Cache Hit Ratio</span>
                    <span className="text-lg font-bold text-primary">
                      {metrics.cacheHitRatio}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.cacheHitRatio}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.cacheHitRatio >= 80 ? '✅ Excellent' : 
                     metrics.cacheHitRatio >= 60 ? '⚠️ Moyen' : 
                     '❌ À améliorer'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      queryClient.invalidateQueries();
                      console.log('🔄 Cache invalidé');
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Invalider Cache
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      console.log('📊 Queries:', queryClient.getQueryCache().getAll());
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Log Queries
                  </Button>
                </div>

                {/* Tips */}
                <div className="mt-4 p-2 bg-blue-500/10 rounded text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> Cache Hit Ratio &gt; 80% = Performance optimale
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  icon: string;
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color = 'gray' }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    gray: 'bg-muted text-foreground'
  };

  return (
    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
};
