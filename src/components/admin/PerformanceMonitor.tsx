import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Database, 
  Cpu, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface PerformanceMetric {
  metric_type: string;
  metric_name: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  trend_direction: string;
  data_points: number;
}

interface EdgeFunctionStats {
  function_name: string;
  total_calls: number;
  avg_execution_time_ms: number;
  p95_execution_time_ms: number;
  error_rate: number;
  success_rate: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [edgeFunctionStats, setEdgeFunctionStats] = useState<EdgeFunctionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoursBack, setHoursBack] = useState(24);
  const { toast } = useToast();

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Fetch performance trends
      const { data: trends, error: trendsError } = await supabase.rpc('get_performance_trends', {
        p_metric_type: null,
        p_hours_back: hoursBack
      });

      if (trendsError) throw trendsError;

      // Fetch edge function stats
      const { data: edgeStats, error: edgeError } = await supabase.rpc('get_edge_function_performance_stats', {
        p_function_name: null,
        p_hours_back: hoursBack
      });

      if (edgeError) throw edgeError;

      setPerformanceMetrics(trends || []);
      setEdgeFunctionStats(edgeStats || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de performance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [hoursBack]);

  const recordTestMetric = async () => {
    try {
      const { error } = await supabase.rpc('record_performance_metric', {
        p_metric_type: 'test',
        p_metric_name: 'admin_dashboard_load',
        p_metric_value: Math.random() * 1000 + 500,
        p_unit: 'ms',
        p_metadata: { recorded_by: 'admin', test: true }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Métrique de test enregistrée",
      });

      fetchPerformanceData();
    } catch (error) {
      console.error('Error recording test metric:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la métrique",
        variant: "destructive"
      });
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu':
        return <Cpu className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'edge_functions':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPerformanceStatus = (value: number, type: string) => {
    if (type === 'error_rate') {
      if (value < 1) return 'excellent';
      if (value < 5) return 'good';
      return 'warning';
    }
    
    if (type === 'execution_time') {
      if (value < 500) return 'excellent';
      if (value < 2000) return 'good';
      return 'warning';
    }
    
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'warning':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Monitoring des Performances</h2>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Monitoring des Performances</h2>
        <div className="flex items-center gap-4">
          <select
            value={hoursBack}
            onChange={(e) => setHoursBack(Number(e.target.value))}
            className="border rounded-md px-3 py-1 bg-background"
          >
            <option value={1}>1 heure</option>
            <option value={6}>6 heures</option>
            <option value={24}>24 heures</option>
            <option value={168}>7 jours</option>
          </select>
          <Button onClick={recordTestMetric} variant="outline" size="sm">
            Test Métrique
          </Button>
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Edge Functions Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {edgeFunctionStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              ) : (
                edgeFunctionStats.map((func) => (
                  <div key={func.function_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{func.function_name}</span>
                      <Badge variant={getPerformanceStatus(func.error_rate, 'error_rate') === 'excellent' ? 'default' : 'destructive'}>
                        {func.success_rate.toFixed(1)}% succès
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">{func.total_calls}</span> appels
                      </div>
                      <div>
                        <span className="font-medium">{func.avg_execution_time_ms.toFixed(0)}ms</span> moy.
                      </div>
                      <div>
                        <span className="font-medium">{func.p95_execution_time_ms.toFixed(0)}ms</span> P95
                      </div>
                    </div>
                    <Progress value={func.success_rate} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Métriques Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune métrique disponible</p>
              ) : (
                performanceMetrics.slice(0, 5).map((metric) => (
                  <div key={`${metric.metric_type}-${metric.metric_name}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.metric_type)}
                      <div>
                        <p className="font-medium text-sm">{metric.metric_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {metric.data_points} points de données
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {metric.avg_value.toFixed(1)}
                      </span>
                      {getTrendIcon(metric.trend_direction)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceMetrics.map((metric) => (
          <Card key={`${metric.metric_type}-${metric.metric_name}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {metric.metric_name}
                </CardTitle>
                {getTrendIcon(metric.trend_direction)}
              </div>
              <div className="flex items-center gap-2">
                {getMetricIcon(metric.metric_type)}
                <Badge variant="outline" className="text-xs">
                  {metric.metric_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  {metric.avg_value.toFixed(1)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Min:</span>
                    <span className="ml-1 font-medium">{metric.min_value.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>
                    <span className="ml-1 font-medium">{metric.max_value.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{metric.data_points} mesures</span>
                  <span className="capitalize">{metric.trend_direction}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {performanceMetrics.length === 0 && edgeFunctionStats.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune donnée de performance</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Les métriques de performance apparaîtront ici une fois que l'activité aura commencé.
            </p>
            <Button onClick={recordTestMetric} variant="outline">
              Enregistrer une métrique de test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitor;