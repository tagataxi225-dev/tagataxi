/**
 * Page de debug pour vérifier la cohérence des tarifs
 * Affiche côte à côte les tarifs configurés dans pricing_rules
 * et les tarifs affichés côté client
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, Database, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';
import { usePriceEstimator } from '@/hooks/usePricingRules';
import { logger } from '@/utils/logger';

interface PricingRule {
  id: string;
  service_type: string;
  vehicle_class: string;
  city: string;
  base_price: number;
  price_per_km: number;
  is_active: boolean;
}

interface PricingComparison {
  service: string;
  category: 'transport' | 'delivery';
  dbBasePrice: number;
  dbPricePerKm: number;
  clientBasePrice: number;
  clientPricePerKm: number;
  isMatching: boolean;
  source: 'database' | 'fallback';
}

export default function PricingDebug() {
  const queryClient = useQueryClient();
  const [dbRules, setDbRules] = useState<PricingRule[]>([]);
  const [comparisons, setComparisons] = useState<PricingComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city] = useState('kinshasa');

  // Hooks de tarification
  const { calculateDeliveryPrice, getServicePricing: getDeliveryServicePricing } = useDeliveryPricing(city);
  
  // Estimateurs de transport
  const ecoEstimator = usePriceEstimator('transport', 'eco');
  const standardEstimator = usePriceEstimator('transport', 'standard');
  const premiumEstimator = usePriceEstimator('transport', 'premium');
  const motoEstimator = usePriceEstimator('transport', 'moto');

  const loadPricingData = async () => {
    setIsLoading(true);
    try {
      logger.info('🔍 Chargement des règles de tarification pour debug');

      // Récupérer toutes les règles actives de la DB
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('city', city.toLowerCase())
        .eq('is_active', true)
        .order('service_type', { ascending: true })
        .order('vehicle_class', { ascending: true });

      if (error) throw error;

      setDbRules(data || []);

      // Comparaisons Livraison
      const deliveryComparisons: PricingComparison[] = ['flash', 'flex', 'maxicharge'].map((service) => {
        const dbRule = data?.find(r => r.service_type === 'delivery' && r.vehicle_class === service);
        const clientPricing = getDeliveryServicePricing(service as any);

        return {
          service,
          category: 'delivery' as const,
          dbBasePrice: dbRule?.base_price || 0,
          dbPricePerKm: dbRule?.price_per_km || 0,
          clientBasePrice: clientPricing.basePrice,
          clientPricePerKm: clientPricing.pricePerKm,
          isMatching: dbRule?.base_price === clientPricing.basePrice && 
                     dbRule?.price_per_km === clientPricing.pricePerKm,
          source: clientPricing.source
        };
      });

      // Comparaisons Transport
      const transportEstimators = [
        { name: 'eco', estimator: ecoEstimator },
        { name: 'standard', estimator: standardEstimator },
        { name: 'premium', estimator: premiumEstimator },
        { name: 'moto', estimator: motoEstimator }
      ];

      const transportComparisons: PricingComparison[] = transportEstimators.map(({ name, estimator }) => {
        const dbRule = data?.find(r => r.service_type === 'transport' && r.vehicle_class === name);
        
        // Calculer un trajet de 5km pour extraire les tarifs
        const testPrice = estimator.estimate(5);
        const clientPricePerKm = estimator.rule?.price_per_km || 0;
        const clientBasePrice = estimator.rule?.base_price || 0;

        return {
          service: name,
          category: 'transport' as const,
          dbBasePrice: dbRule?.base_price || 0,
          dbPricePerKm: dbRule?.price_per_km || 0,
          clientBasePrice,
          clientPricePerKm,
          isMatching: dbRule?.base_price === clientBasePrice && 
                     dbRule?.price_per_km === clientPricePerKm,
          source: estimator.rule ? 'database' : 'fallback'
        };
      });

      setComparisons([...deliveryComparisons, ...transportComparisons]);

      logger.info('✅ Analyse de cohérence terminée', {
        total: deliveryComparisons.length + transportComparisons.length,
        matching: [...deliveryComparisons, ...transportComparisons].filter(c => c.isMatching).length
      });

    } catch (error) {
      logger.error('❌ Erreur chargement debug pricing', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, [city]);

  const handleRefreshCache = () => {
    logger.info('🔄 Invalidation des caches de tarification');
    queryClient.invalidateQueries({ queryKey: ['delivery-pricing-rules'] });
    queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    setTimeout(loadPricingData, 500);
  };

  const hasInconsistencies = comparisons.some(c => !c.isMatching);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 Debug Tarification</h1>
          <p className="text-muted-foreground mt-1">
            Vérification de cohérence entre admin et client • Ville: <strong>{city}</strong>
          </p>
        </div>
        <Button onClick={handleRefreshCache} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Status Overview */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          {hasInconsistencies ? (
            <>
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <div>
                <h3 className="font-bold text-lg text-destructive">Incohérences détectées</h3>
                <p className="text-sm text-muted-foreground">
                  {comparisons.filter(c => !c.isMatching).length} service(s) avec tarifs non synchronisés
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <div>
                <h3 className="font-bold text-lg text-green-500">✅ Tous les tarifs sont synchronisés</h3>
                <p className="text-sm text-muted-foreground">
                  Les tarifs client correspondent exactement à la configuration admin
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Delivery Pricing */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📦 Tarifs Livraison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Service</th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    Base (DB)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Base (Client)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    CDF/km (DB)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    CDF/km (Client)
                  </div>
                </th>
                <th className="text-center py-2 px-4">Source</th>
                <th className="text-center py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisons
                .filter(c => c.category === 'delivery')
                .map((comparison) => (
                  <tr key={comparison.service} className={`border-b ${!comparison.isMatching ? 'bg-destructive/5' : ''}`}>
                    <td className="py-3 px-4 font-semibold capitalize">{comparison.service}</td>
                    <td className="text-center py-3 px-4">{comparison.dbBasePrice.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.clientBasePrice.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.dbPricePerKm.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.clientPricePerKm.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        comparison.source === 'database' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                      }`}>
                        {comparison.source}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {comparison.isMatching ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transport Pricing */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🚗 Tarifs Transport
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Service</th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    Base (DB)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Base (Client)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    CDF/km (DB)
                  </div>
                </th>
                <th className="text-center py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    CDF/km (Client)
                  </div>
                </th>
                <th className="text-center py-2 px-4">Source</th>
                <th className="text-center py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisons
                .filter(c => c.category === 'transport')
                .map((comparison) => (
                  <tr key={comparison.service} className={`border-b ${!comparison.isMatching ? 'bg-destructive/5' : ''}`}>
                    <td className="py-3 px-4 font-semibold capitalize">{comparison.service}</td>
                    <td className="text-center py-3 px-4">{comparison.dbBasePrice.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.clientBasePrice.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.dbPricePerKm.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">{comparison.clientPricePerKm.toLocaleString()} CDF</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        comparison.source === 'database' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
                      }`}>
                        {comparison.source}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {comparison.isMatching ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Database Rules Raw Data */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">📊 Règles brutes (Database)</h2>
        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs">
            {JSON.stringify(dbRules, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
}
