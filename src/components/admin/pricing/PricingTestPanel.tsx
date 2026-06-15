import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const PricingTestPanel = () => {
  const { data: serviceConfigs } = useQuery({
    queryKey: ['service-configs-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: pricingRules } = useQuery({
    queryKey: ['pricing-rules-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'transport')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const expectedServiceTypes = ['taxi_moto', 'taxi_eco', 'taxi_confort', 'taxi_premium'];
  const expectedVehicleClasses = ['moto', 'eco', 'standard', 'premium'];
  const cities = ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'];

  const missingConfigs = expectedServiceTypes.filter(
    type => !serviceConfigs?.some(c => c.service_type === type)
  );

  const missingRules = cities.flatMap(city =>
    expectedVehicleClasses
      .filter(vc => !pricingRules?.some(r => r.city === city && r.vehicle_class === vc))
      .map(vc => `${city} - ${vc}`)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic Tarification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Configurations */}
        <div>
          <h3 className="font-semibold mb-2">Service Configurations (taxi)</h3>
          {missingConfigs.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Types manquants: {missingConfigs.join(', ')}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Tous les types de véhicules sont configurés
              </AlertDescription>
            </Alert>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            Trouvés: {serviceConfigs?.map(c => c.service_type).join(', ')}
          </div>
        </div>

        {/* Pricing Rules */}
        <div>
          <h3 className="font-semibold mb-2">Pricing Rules (transport)</h3>
          {missingRules.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Règles manquantes ({missingRules.length}): {missingRules.slice(0, 5).join(', ')}
                {missingRules.length > 5 && '...'}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Toutes les règles de tarification sont définies
              </AlertDescription>
            </Alert>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            Total: {pricingRules?.length || 0} règles actives
          </div>
        </div>

        {/* Résumé par ville */}
        <div>
          <h3 className="font-semibold mb-2">Résumé par ville</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {cities.map(city => {
              const cityRules = pricingRules?.filter(r => r.city === city) || [];
              return (
                <div key={city} className="p-2 border rounded">
                  <div className="font-medium">{city}</div>
                  <div className="text-muted-foreground">
                    {cityRules.length} / 4 types
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
