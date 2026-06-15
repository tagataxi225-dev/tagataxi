import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Package, Percent, Settings, DollarSign, Clock, MapPin, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AdminServiceManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service configuration statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['serviceStats'],
    queryFn: async () => {
      const [commissionsRes, pricingRes, deliveryRes] = await Promise.all([
        supabase.from('commission_settings').select('*').eq('is_active', true),
        supabase.from('zone_pricing_rules').select('*').eq('is_active', true),
        supabase.from('delivery_pricing_config').select('*').eq('is_active', true)
      ]);

      return {
        activeCommissions: commissionsRes.data?.length || 0,
        activePricingRules: pricingRes.data?.length || 0,
        activeDeliveryPricing: deliveryRes.data?.length || 0
      };
    }
  });

  // Fetch commission settings
  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['commissionSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('service_type');

      if (error) throw error;
      return data;
    }
  });

  // Fetch delivery pricing
  const { data: deliveryPricing, isLoading: deliveryLoading } = useQuery({
    queryKey: ['deliveryPricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_pricing_config')
        .select('*')
        .order('service_type');

      if (error) throw error;
      return data;
    }
  });

  // Fetch transport pricing rules
  const { data: transportPricing, isLoading: transportLoading } = useQuery({
    queryKey: ['transportPricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone_pricing_rules')
        .select(`
          *,
          service_zones(name, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const getServiceTypeBadge = (serviceType: string) => {
    const typeMap = {
      taxi: { variant: 'default' as const, label: 'Taxi', icon: Car },
      delivery: { variant: 'secondary' as const, label: 'Livraison', icon: Package },
      flash: { variant: 'destructive' as const, label: 'Flash', icon: Clock },
      flex: { variant: 'outline' as const, label: 'Flex', icon: Package },
      maxicharge: { variant: 'default' as const, label: 'Maxicharge', icon: Package }
    };
    
    const config = typeMap[serviceType as keyof typeof typeMap] || { 
      variant: 'secondary' as const, 
      label: serviceType,
      icon: Settings
    };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (statsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Services</h1>
          <p className="text-muted-foreground">
            Configurez les types de services, tarifs et commissions
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurations Commissions</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeCommissions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Règles de commission actives
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarifs Transport</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activePricingRules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Règles tarifaires transport
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarifs Livraison</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeDeliveryPricing || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Configurations livraison
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
              <CardDescription>
                Fonctionnalités de gestion courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button className="h-20 flex-col space-y-2">
                  <Settings className="h-6 w-6" />
                  <span>Configurer Services</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <DollarSign className="h-6 w-6" />
                  <span>Ajuster Tarifs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Commissions</CardTitle>
              <CardDescription>
                Gérez les taux de commission par type de service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <div className="text-center py-4">Chargement des commissions...</div>
              ) : (
                <div className="space-y-4">
                  {commissions?.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{commission.service_type}</h4>
                          {getServiceTypeBadge(commission.service_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Chauffeur: {commission.driver_rate}% • Admin: {commission.admin_rate}% • Plateforme: {commission.platform_rate}%
                        </p>
                        <Badge variant={commission.is_active ? "default" : "secondary"}>
                          {commission.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tarification Transport</CardTitle>
              <CardDescription>
                Configuration des tarifs de transport par zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transportLoading ? (
                <div className="text-center py-4">Chargement des tarifs transport...</div>
              ) : (
                <div className="space-y-4">
                  {transportPricing?.map((pricing) => (
                    <div key={pricing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">
                            {pricing.service_zones?.name} - {pricing.vehicle_class}
                          </h4>
                          <Badge variant={pricing.is_active ? "default" : "secondary"}>
                            {pricing.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Base: {pricing.base_price} CDF • 
                          /km: {pricing.price_per_km} CDF • 
                          /min: {pricing.price_per_minute} CDF
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Surge: x{pricing.surge_multiplier}
                          </Badge>
                          {pricing.minimum_fare && (
                            <Badge variant="secondary">
                              Min: {pricing.minimum_fare} CDF
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tarification Livraison</CardTitle>
              <CardDescription>
                Configuration des tarifs de livraison par type et ville
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryLoading ? (
                <div className="text-center py-4">Chargement des tarifs livraison...</div>
              ) : (
                <div className="space-y-4">
                  {deliveryPricing?.map((pricing) => (
                    <div key={pricing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{pricing.city} - {pricing.service_type}</h4>
                          {getServiceTypeBadge(pricing.service_type)}
                          <Badge variant={pricing.is_active ? "default" : "secondary"}>
                            {pricing.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Base: {pricing.base_price} {pricing.currency} • 
                          Par km: {pricing.price_per_km} {pricing.currency}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            Min: {pricing.minimum_fare} {pricing.currency}
                          </Badge>
                          {pricing.surge_multiplier && pricing.surge_multiplier > 1 && (
                            <Badge variant="outline">
                              Surge: x{pricing.surge_multiplier}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}