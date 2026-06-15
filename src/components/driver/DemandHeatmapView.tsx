/**
 * 🔥 Vue Carte de Chaleur de la Demande par Zone
 * Affiche les zones rentables pour les chauffeurs/livreurs
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, TrendingUp, DollarSign, Users, Clock, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';

interface ZoneDemand {
  zone_id: string;
  zone_name: string;
  pending_requests: number;
  available_drivers: number;
  demand_ratio: number;
  avg_price: number;
  peak_hours: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

export default function DemandHeatmapView() {
  const [zones, setZones] = useState<ZoneDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState('Kinshasa');

  const loadDemandData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('calculate_demand_heatmap', {
        city_param: userCity,
        time_range_minutes: 60
      });

      if (error) throw error;

      setZones((data || []) as ZoneDemand[]);
    } catch (error) {
      console.error('Error loading demand heatmap:', error);
      toast.error('Erreur de chargement des zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDemandData, 30000);
    return () => clearInterval(interval);
  }, [userCity]);

  const getDemandLevel = (ratio: number) => {
    if (ratio >= 2) return { label: 'Très Forte', color: 'bg-red-500', textColor: 'text-red-500' };
    if (ratio >= 1) return { label: 'Forte', color: 'bg-orange-500', textColor: 'text-orange-500' };
    if (ratio >= 0.5) return { label: 'Moyenne', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { label: 'Faible', color: 'bg-green-500', textColor: 'text-green-500' };
  };

  const getBestPeriod = (peakHours: any) => {
    const periods = [
      { name: 'Matin', value: peakHours?.morning || 0 },
      { name: 'Après-midi', value: peakHours?.afternoon || 0 },
      { name: 'Soir', value: peakHours?.evening || 0 }
    ];
    return periods.sort((a, b) => b.value - a.value)[0].name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Zones Rentables</h2>
          <p className="text-sm text-muted-foreground">Trouvez les zones à forte demande en temps réel</p>
        </div>
        <Button onClick={loadDemandData} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-4">
          <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p>Carte interactive à venir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zones List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => {
          const demand = getDemandLevel(zone.demand_ratio);
          
          return (
            <Card key={zone.zone_id} className="hover:shadow-glow transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {zone.zone_name}
                  </CardTitle>
                  <Badge className={`${demand.color} text-white`}>
                    {demand.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Demandes
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {zone.pending_requests}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Chauffeurs
                    </div>
                    <p className="text-2xl font-bold text-secondary">
                      {zone.available_drivers}
                    </p>
                  </div>
                </div>

                {/* Price & Best Period */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold">
                      {zone.avg_price ? `${Math.round(zone.avg_price).toLocaleString()} FC` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">
                      Pic: {getBestPeriod(zone.peak_hours)}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {zone.demand_ratio >= 1 && (
                  <Button className="w-full" size="sm" variant="default">
                    <Navigation className="h-4 w-4 mr-2" />
                    Me positionner ici
                  </Button>
                )}

                {/* Recommendation */}
                {zone.demand_ratio >= 2 ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs text-red-600 font-semibold">
                      🔥 Zone très rentable - Allez-y maintenant !
                    </p>
                  </div>
                ) : zone.demand_ratio >= 1 ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-xs text-orange-600">
                      💰 Bonne opportunité de gain
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {zones.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune zone active pour le moment</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Légende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Très forte (≥2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Forte (1-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Moyenne (0.5-1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Faible (&lt;0.5)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
