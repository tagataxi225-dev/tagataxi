/**
 * 🌍 Gestionnaire de Services par Ville
 * Outil admin pour gérer l'activation des services transport dans toutes les villes
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Power, PowerOff, RefreshCw, Copy, AlertTriangle, Settings } from 'lucide-react';
import { SUPPORTED_CITIES } from '@/constants/cities';

interface CityServiceStatus {
  city: string;
  vehicle_class: string;
  is_active: boolean;
  currency: string;
  base_price: number;
}

interface ServiceConfig {
  id: string;
  service_category: string;
  display_name: string;
  is_active: boolean;
  service_status: string;
  sort_order: number | null;
}

// Une entrée de catégorie agrégée (première ligne + état majoritaire)
interface CategoryConfig {
  service_category: string;
  display_name: string;
  is_active: boolean;
  ids: string[];
}

export const CityServicesManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>('Kinshasa');

  // ── service_configurations ──────────────────────────────────────────────

  const { data: serviceConfigs, isLoading: loadingConfigs } = useQuery({
    queryKey: ['service-configurations'],
    queryFn: async (): Promise<CategoryConfig[]> => {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('id, service_category, display_name, is_active, sort_order')
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;

      // Grouper par service_category
      const map = new Map<string, CategoryConfig>();
      for (const row of (data as ServiceConfig[])) {
        if (!map.has(row.service_category)) {
          map.set(row.service_category, {
            service_category: row.service_category,
            display_name: row.display_name,
            is_active: row.is_active,
            ids: [row.id],
          });
        } else {
          map.get(row.service_category)!.ids.push(row.id);
          // is_active = true seulement si toutes les lignes sont actives
          if (!row.is_active) map.get(row.service_category)!.is_active = false;
        }
      }
      return Array.from(map.values());
    },
    staleTime: 60 * 1000,
  });

  const toggleServiceConfig = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { error } = await supabase
        .from('service_configurations')
        .update({ is_active })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      toast({
        title: is_active ? "✅ Service activé" : "⏸️ Service désactivé",
        description: is_active
          ? "Le service a été activé avec succès"
          : "Le service a été désactivé",
      });
      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Erreur", description: error.message });
    },
  });

  // ── pricing_rules ────────────────────────────────────────────────────────

  // Récupérer le statut de tous les services par ville
  const { data: cityServices, isLoading } = useQuery({
    queryKey: ['city-services-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('city, vehicle_class, is_active, currency, base_price')
        .eq('service_type', 'transport')
        .order('city')
        .order('vehicle_class');

      if (error) throw error;
      return data as CityServiceStatus[];
    }
  });

  // Activer tous les services d'une ville
  const activateCity = useMutation({
    mutationFn: async (city: string) => {
      const { data, error } = await supabase.rpc('activate_transport_services_all_cities');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Services activés",
        description: "Tous les services transport ont été activés pour toutes les villes"
      });
      queryClient.invalidateQueries({ queryKey: ['city-services-status'] });
      queryClient.invalidateQueries({ queryKey: ['available-taxi-services'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message
      });
    }
  });

  // Désactiver tous les services d'une ville
  const deactivateCity = useMutation({
    mutationFn: async (city: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: false })
        .eq('city', city)
        .eq('service_type', 'transport');

      if (error) throw error;
    },
    onSuccess: (_, city) => {
      toast({
        title: "⏸️ Services désactivés",
        description: `Tous les services de ${city} ont été désactivés`
      });
      queryClient.invalidateQueries({ queryKey: ['city-services-status'] });
      queryClient.invalidateQueries({ queryKey: ['available-taxi-services'] });
    }
  });

  // Dupliquer les règles d'une ville source vers une ville cible
  const duplicateRules = useMutation({
    mutationFn: async ({ sourceCity, targetCity }: { sourceCity: string; targetCity: string }) => {
      // Récupérer les règles source
      const { data: sourceRules, error: fetchError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('city', sourceCity)
        .eq('service_type', 'transport')
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      // Supprimer les anciennes règles de la ville cible
      const { error: deleteError } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('city', targetCity)
        .eq('service_type', 'transport');

      if (deleteError) throw deleteError;

      // Insérer les nouvelles règles
      const newRules = sourceRules?.map(rule => ({
        service_type: rule.service_type,
        vehicle_class: rule.vehicle_class,
        city: targetCity,
        base_price: rule.base_price,
        price_per_km: rule.price_per_km,
        price_per_minute: rule.price_per_minute,
        minimum_fare: rule.minimum_fare,
        surge_multiplier: rule.surge_multiplier,
        waiting_fee_per_minute: rule.waiting_fee_per_minute,
        free_waiting_time_minutes: rule.free_waiting_time_minutes,
        max_waiting_time_minutes: rule.max_waiting_time_minutes,
        currency: rule.currency,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('pricing_rules')
        .insert(newRules);

      if (insertError) throw insertError;
    },
    onSuccess: (_, { sourceCity, targetCity }) => {
      toast({
        title: "📋 Règles dupliquées",
        description: `Règles de ${sourceCity} copiées vers ${targetCity}`
      });
      queryClient.invalidateQueries({ queryKey: ['city-services-status'] });
    }
  });

  // Grouper les services par ville
  const servicesByCity = cityServices?.reduce((acc, service) => {
    if (!acc[service.city]) {
      acc[service.city] = [];
    }
    acc[service.city].push(service);
    return acc;
  }, {} as Record<string, CityServiceStatus[]>);

  // Statistiques par ville
  const getCityStats = (city: string) => {
    const services = servicesByCity?.[city] || [];
    const active = services.filter(s => s.is_active).length;
    const total = services.length;
    return { active, total, percentage: total > 0 ? (active / total) * 100 : 0 };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Gestion des Services par Ville
        </CardTitle>
        <CardDescription>
          Activez ou désactivez les services de transport pour chaque ville
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Actions globales */}
        <div className="flex gap-2">
          <Button
            onClick={() => activateCity.mutate('all')}
            disabled={activateCity.isPending}
            className="gap-2"
          >
            <Power className="h-4 w-4" />
            Activer Toutes les Villes
          </Button>
          
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['city-services-status'] })}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </Button>
        </div>

        {/* Vue d'ensemble par ville */}
        <div className="grid gap-4 md:grid-cols-2">
          {SUPPORTED_CITIES.map((cityConfig) => {
            const city = cityConfig.value;
            const stats = getCityStats(city);
            const services = servicesByCity?.[city] || [];
            const hasServices = services.length > 0;
            const allActive = stats.active === stats.total && stats.total > 0;

            return (
              <Card key={city} className={!hasServices ? 'border-orange-500/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{cityConfig.emoji}</span>
                      {city}
                    </CardTitle>
                    <Badge variant={allActive ? "default" : "secondary"}>
                      {stats.active}/{stats.total}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Alerte si pas de services */}
                  {!hasServices && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      Aucun service configuré
                    </div>
                  )}

                  {/* Liste des services */}
                  {hasServices && (
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((service) => (
                        <div
                          key={service.vehicle_class}
                          className={`flex items-center gap-2 text-sm p-2 rounded ${
                            service.is_active
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {service.is_active ? (
                            <Power className="h-3 w-3" />
                          ) : (
                            <PowerOff className="h-3 w-3" />
                          )}
                          <span className="capitalize">{service.vehicle_class}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions par ville */}
                  <div className="flex gap-2 pt-2">
                    {!allActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => activateCity.mutate(city)}
                        disabled={activateCity.isPending}
                      >
                        <Power className="h-3 w-3" />
                        Activer
                      </Button>
                    )}
                    
                    {allActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => deactivateCity.mutate(city)}
                        disabled={deactivateCity.isPending}
                      >
                        <PowerOff className="h-3 w-3" />
                        Désactiver
                      </Button>
                    )}

                    {!hasServices && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 gap-1"
                        onClick={() => duplicateRules.mutate({ sourceCity: 'Kinshasa', targetCity: city })}
                        disabled={duplicateRules.isPending}
                      >
                        <Copy className="h-3 w-3" />
                        Copier depuis Kinshasa
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Configurations des services */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Configurations des Services</h3>
          </div>

          {loadingConfigs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !serviceConfigs?.length ? (
            <p className="text-sm text-muted-foreground">Aucune configuration trouvée</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {serviceConfigs.map((cfg) => (
                <div
                  key={cfg.service_category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{cfg.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {cfg.service_category}
                    </p>
                  </div>
                  <Switch
                    checked={cfg.is_active}
                    disabled={toggleServiceConfig.isPending}
                    onCheckedChange={(checked) =>
                      toggleServiceConfig.mutate({ ids: cfg.ids, is_active: checked })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <Power className="h-3 w-3 text-green-600" />
            Service actif
          </div>
          <div className="flex items-center gap-1">
            <PowerOff className="h-3 w-3" />
            Service inactif
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            Non configuré
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
