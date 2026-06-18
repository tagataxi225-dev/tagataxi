import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Car, Clock, Navigation, Settings, Eye, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AdminLocationManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch location and transport statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['locationStats'],
    queryFn: async () => {
      const [zonesRes, driversRes, bookingsRes, locationsRes] = await Promise.all([
        supabase.from('service_zones').select('id, is_active'),
        supabase.from('chauffeurs').select('id, is_active'),
        supabase.from('transport_bookings').select('id, status'),
        supabase.from('driver_locations').select('id, is_online, last_ping').gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      ]);

      const zones = zonesRes.data || [];
      const drivers = driversRes.data || [];
      const bookings = bookingsRes.data || [];
      const locations = locationsRes.data || [];

      return {
        totalZones: zones.length,
        activeZones: zones.filter(z => z.is_active).length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.is_active).length,
        onlineDrivers: locations.filter(l => l.is_online).length,
        activeBookings: bookings.filter(b => ['pending', 'confirmed', 'driver_assigned', 'in_progress'].includes(b.status)).length
      };
    },
    refetchInterval: 30000
  });

  // Fetch service zones
  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ['serviceZones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_zones')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch real-time driver locations
  const { data: driverLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['driverLocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .gte('last_ping', new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order('last_ping', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Mock driver info since relation is broken
      return (data || []).map(location => ({
        ...location,
        chauffeurs: {
          display_name: `Chauffeur ${location.driver_id.slice(0, 8)}`,
          vehicle_class: location.vehicle_class || 'standard',
          is_active: true
        }
      }));
    },
    refetchInterval: 10000 // Refresh every 10 seconds for real-time
  });

  // Fetch pricing rules
  const { data: pricingRules, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone_pricing_rules')
        .select(`
          *,
          service_zones(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const getOnlineStatusBadge = (isOnline: boolean, lastPing: string) => {
    const lastPingTime = new Date(lastPing);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastPingTime.getTime()) / (1000 * 60);

    if (isOnline && diffMinutes < 5) {
      return <Badge variant="default" className="bg-green-600">En ligne</Badge>;
    } else if (isOnline && diffMinutes < 15) {
      return <Badge variant="secondary">Récemment actif</Badge>;
    } else {
      return <Badge variant="outline">Hors ligne</Badge>;
    }
  };

  if (statsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Localisation</h1>
          <p className="text-muted-foreground">
            Gérez les zones de service, tarifs et suivi des chauffeurs en temps réel
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="zones">Zones de Service</TabsTrigger>
          <TabsTrigger value="tracking">Suivi Temps Réel</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zones de Service</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalZones || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeZones || 0} actives
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDrivers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeDrivers || 0} actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Ligne</CardTitle>
                <Navigation className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.onlineDrivers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Chauffeurs en ligne maintenant
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Actives</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  En cours ou en attente
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zones de Service</CardTitle>
              <CardDescription>
                Gérez les zones géographiques couvertes par TAGA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {zonesLoading ? (
                <div className="text-center py-4">Chargement des zones...</div>
              ) : (
                <div className="space-y-4">
                  {zones?.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{zone.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {zone.city}, {zone.country_code || 'CD'}
                        </p>
                        <Badge variant={zone.is_active ? "default" : "secondary"}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suivi Temps Réel des Chauffeurs</CardTitle>
              <CardDescription>
                Positions et statuts des chauffeurs en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locationsLoading ? (
                <div className="text-center py-4">Chargement des positions...</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {driverLocations?.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {location.chauffeurs?.display_name || 'Chauffeur inconnu'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {location.chauffeurs?.vehicle_class || 'standard'} • 
                          Dernière position: {new Date(location.last_ping).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center space-x-2">
                          {getOnlineStatusBadge(location.is_online, location.last_ping)}
                          <Badge variant={location.is_available ? "default" : "secondary"}>
                            {location.is_available ? 'Disponible' : 'Occupé'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Tarifaire</CardTitle>
              <CardDescription>
                Gérez les tarifs par zone et type de véhicule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="text-center py-4">Chargement des tarifs...</div>
              ) : (
                <div className="space-y-4">
                  {pricingRules?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {rule.service_zones?.name} - {rule.vehicle_class}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Base: {rule.base_price} CDF • Par km: {rule.price_per_km} CDF • Par min: {rule.price_per_minute} CDF
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            Surge: x{rule.surge_multiplier}
                          </Badge>
                          {rule.minimum_fare && (
                            <Badge variant="secondary">
                              Min: {rule.minimum_fare} CDF
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
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