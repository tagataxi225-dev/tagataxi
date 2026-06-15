/**
 * Dashboard Admin pour gérer et visualiser les tests A/B
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, TrendingUp, Users, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import { formatPercentage, calculateLift, isStatisticallySignificant } from '@/utils/abTesting';
import { useToast } from '@/hooks/use-toast';

interface ExperimentMetrics {
  experiment_id: string;
  variant: 'control' | 'variant';
  views: number;
  clicks: number;
  conversions: number;
  unique_users: number;
  ctr: number;
  conversion_rate: number;
}

interface Experiment {
  id: string;
  experiment_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  variants: any;
}

export const ABTestingDashboard = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metrics, setMetrics] = useState<Map<string, ExperimentMetrics[]>>(new Map());
  const [significance, setSignificance] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les expériences
      const { data: expsData, error: expsError } = await supabase
        .from('ab_experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (expsError) throw expsError;
      setExperiments(expsData || []);

      // Charger les métriques pour chaque expérience
      const { data: metricsData, error: metricsError } = await supabase
        .from('ab_experiment_metrics')
        .select('*');

      if (metricsError) throw metricsError;

      // Grouper les métriques par experiment_id
      const metricsMap = new Map<string, ExperimentMetrics[]>();
      metricsData?.forEach(metric => {
        const existing = metricsMap.get(metric.experiment_id) || [];
        metricsMap.set(metric.experiment_id, [...existing, metric as ExperimentMetrics]);
      });
      setMetrics(metricsMap);

      // Charger la significativité pour chaque expérience
      for (const exp of expsData || []) {
        const { data: sigData, error: sigError } = await supabase
          .rpc('calculate_ab_significance', { experiment_id_param: exp.experiment_id });

        if (!sigError && sigData) {
          const sigMap = new Map(significance);
          sigMap.set(exp.experiment_id, sigData);
          setSignificance(sigMap);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données A/B:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données A/B',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExperiment = async (experimentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({ is_active: !isActive })
        .eq('experiment_id', experimentId);

      if (error) throw error;

      toast({
        title: isActive ? 'Expérience pausée' : 'Expérience activée',
        description: `L'expérience a été ${isActive ? 'mise en pause' : 'activée'} avec succès`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'expérience',
        variant: 'destructive'
      });
    }
  };

  const deployWinner = async (experimentId: string, winnerVariant: 'control' | 'variant') => {
    // TODO: Implémenter le déploiement du variant gagnant
    toast({
      title: '🎉 Variant déployé',
      description: `Le variant "${winnerVariant}" a été déployé pour tous les utilisateurs`,
    });
  };

  const renderExperimentCard = (experiment: Experiment) => {
    const expMetrics = metrics.get(experiment.experiment_id) || [];
    const controlMetrics = expMetrics.find(m => m.variant === 'control');
    const variantMetrics = expMetrics.find(m => m.variant === 'variant');
    const sigData = significance.get(experiment.experiment_id);
    const confidenceLevel = sigData?.[0]?.confidence_level || 0;

    const lift = controlMetrics && variantMetrics
      ? calculateLift(controlMetrics.conversion_rate || 0, variantMetrics.conversion_rate || 0)
      : 0;

    const isSignificant = isStatisticallySignificant(confidenceLevel);
    const winner = variantMetrics && controlMetrics && variantMetrics.conversion_rate > controlMetrics.conversion_rate
      ? 'variant'
      : 'control';

    return (
      <Card key={experiment.id} className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{experiment.name}</h3>
              <Badge variant={experiment.is_active ? 'default' : 'secondary'}>
                {experiment.is_active ? 'Actif' : 'Pausé'}
              </Badge>
              {isSignificant && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Significatif {confidenceLevel}%
                </Badge>
              )}
            </div>
            {experiment.description && (
              <p className="text-sm text-muted-foreground">{experiment.description}</p>
            )}
          </div>

          <Button
            size="sm"
            variant={experiment.is_active ? 'outline' : 'default'}
            onClick={() => toggleExperiment(experiment.experiment_id, experiment.is_active)}
          >
            {experiment.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Control */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Control</span>
              {winner === 'control' && isSignificant && (
                <Badge className="bg-green-100 text-green-800">Gagnant</Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vues</span>
                <span className="font-medium">{controlMetrics?.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Clics</span>
                <span className="font-medium">{controlMetrics?.clicks?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">{controlMetrics?.conversions?.toLocaleString() || 0}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Taux conversion</span>
                  <span className="text-primary">{formatPercentage(controlMetrics?.conversion_rate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variant */}
          <div className="border rounded-lg p-4 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Variant</span>
              {winner === 'variant' && isSignificant && (
                <Badge className="bg-green-100 text-green-800">Gagnant</Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vues</span>
                <span className="font-medium">{variantMetrics?.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Clics</span>
                <span className="font-medium">{variantMetrics?.clicks?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">{variantMetrics?.conversions?.toLocaleString() || 0}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Taux conversion</span>
                  <span className="text-primary">{formatPercentage(variantMetrics?.conversion_rate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lift et actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${lift > 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm font-medium">
                Lift: <span className={lift > 0 ? 'text-green-600' : 'text-red-600'}>
                  {lift > 0 ? '+' : ''}{lift.toFixed(2)}%
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {((controlMetrics?.unique_users || 0) + (variantMetrics?.unique_users || 0)).toLocaleString()} utilisateurs
              </span>
            </div>
          </div>

          {isSignificant && (
            <Button
              size="sm"
              onClick={() => deployWinner(experiment.experiment_id, winner)}
            >
              Déployer {winner}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  const activeExperiments = experiments.filter(e => e.is_active);
  const pausedExperiments = experiments.filter(e => !e.is_active);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart className="h-8 w-8" />
            A/B Testing Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez et analysez vos expériences d'optimisation des conversions
          </p>
        </div>

        <Button onClick={loadData}>
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Actifs ({activeExperiments.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Pausés ({pausedExperiments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeExperiments.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Aucune expérience active</p>
            </Card>
          ) : (
            activeExperiments.map(renderExperimentCard)
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4 mt-6">
          {pausedExperiments.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Aucune expérience en pause</p>
            </Card>
          ) : (
            pausedExperiments.map(renderExperimentCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
