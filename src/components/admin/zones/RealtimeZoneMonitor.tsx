import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency as formatCurrencyUtil } from '@/utils/formatCurrency'
import { 
  Activity, 
  Car, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react'

interface ZoneMetrics {
  zone_id: string
  zone_name: string
  active_drivers: number
  available_drivers: number
  pending_requests: number
  completed_rides: number
  revenue_today: number
  average_wait_time: number
  surge_multiplier: number
  last_updated: string
}

export const RealtimeZoneMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ZoneMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { toast } = useToast()

  const fetchZoneMetrics = async () => {
    try {
      // Récupérer les zones actives
      const { data: zones, error: zonesError } = await supabase
        .from('service_zones')
        .select('id, name')
        .eq('status', 'active')

      if (zonesError) throw zonesError
      if (!zones) return

      const zoneMetrics: ZoneMetrics[] = zones.map(zone => ({
        zone_id: zone.id,
        zone_name: zone.name,
        active_drivers: Math.floor(Math.random() * 20) + 5, // Données simulées
        available_drivers: Math.floor(Math.random() * 15) + 2,
        pending_requests: Math.floor(Math.random() * 10),
        completed_rides: Math.floor(Math.random() * 50) + 10,
        revenue_today: Math.floor(Math.random() * 500000) + 100000,
        average_wait_time: Math.floor(Math.random() * 15) + 3,
        surge_multiplier: Math.random() > 0.7 ? 1.5 : 1.0,
        last_updated: new Date().toISOString()
      }))

      setMetrics(zoneMetrics)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les métriques des zones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZoneMetrics()

    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchZoneMetrics, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const getZoneStatus = (zone: ZoneMetrics) => {
    const demandRatio = zone.pending_requests / Math.max(zone.available_drivers, 1)
    
    if (demandRatio > 2) return { status: 'high-demand', color: 'destructive' }
    if (demandRatio > 1) return { status: 'medium-demand', color: 'warning' }
    return { status: 'normal', color: 'success' }
  }

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, 'CDF')

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Chargement des métriques...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec dernière mise à jour */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Monitoring Temps Réel</h3>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchZoneMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Grille des métriques par zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((zone) => {
          const zoneStatus = getZoneStatus(zone)
          
          return (
            <Card key={zone.zone_id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5" />
                    {zone.zone_name}
                  </CardTitle>
                  <Badge variant="outline">
                    {zoneStatus.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Chauffeurs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Chauffeurs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {zone.available_drivers}/{zone.active_drivers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      disponibles/actifs
                    </div>
                  </div>
                </div>

                {/* Demandes en attente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Demandes</span>
                  </div>
                  <div className="text-sm font-medium text-warning">
                    {zone.pending_requests} en attente
                  </div>
                </div>

                {/* Courses complétées */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Courses (auj.)</span>
                  </div>
                  <div className="text-sm font-medium text-success">
                    {zone.completed_rides}
                  </div>
                </div>

                {/* Revenus */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Revenus</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(zone.revenue_today)}
                  </div>
                </div>

                {/* Temps d'attente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Attente moy.</span>
                  </div>
                  <div className="text-sm font-medium">
                    {zone.average_wait_time}min
                  </div>
                </div>

                {/* Surge multiplier */}
                {zone.surge_multiplier > 1.0 && (
                  <div className="flex items-center justify-between p-2 bg-warning/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-warning">
                        Surge actif
                      </span>
                    </div>
                    <div className="text-sm font-bold text-warning">
                      {zone.surge_multiplier.toFixed(1)}x
                    </div>
                  </div>
                )}

                {/* Barre de charge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Charge zone</span>
                    <span>
                      {Math.round((zone.pending_requests / Math.max(zone.available_drivers, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((zone.pending_requests / Math.max(zone.available_drivers, 1)) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {metrics.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucune zone active trouvée</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealtimeZoneMonitor