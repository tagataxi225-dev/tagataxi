import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics'
import { useToast } from '@/hooks/use-toast'
import { MapPin, TrendingUp, Users, DollarSign, Clock, Star } from 'lucide-react'

export const ZoneManagementDashboard = () => {
  const { fetchZoneAnalytics, exportAnalytics } = useAdminAnalytics()
  const { toast } = useToast()
  const [zoneAnalytics, setZoneAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    country_code: '',
    zone_name: '',
    date_range: {
      start: '',
      end: ''
    }
  })

  const loadZoneAnalytics = async () => {
    setLoading(true)
    try {
      const data = await fetchZoneAnalytics(filters)
      setZoneAnalytics(data)
    } catch (error) {
      console.error('Error loading zone analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportAnalytics('zones', filters)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  useEffect(() => {
    loadZoneAnalytics()
  }, [])

  const countries = [
    { code: 'CD', name: 'République Démocratique du Congo' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'FR', name: 'France' },
    { code: 'US', name: 'États-Unis' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Zones</h1>
        <Button onClick={handleExport} variant="outline">
          Exporter les Données
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics des Zones</TabsTrigger>
          <TabsTrigger value="management">Gestion des Zones</TabsTrigger>
          <TabsTrigger value="pricing">Tarification par Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Select
                    value={filters.country_code}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, country_code: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les pays</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    value={filters.zone_name}
                    onChange={(e) => setFilters(prev => ({ ...prev, zone_name: e.target.value }))}
                    placeholder="Nom de la zone"
                  />
                </div>

                <div>
                  <Label htmlFor="start-date">Date de début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.date_range.start}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      date_range: { ...prev.date_range, start: e.target.value }
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Date de fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.date_range.end}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      date_range: { ...prev.date_range, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={loadZoneAnalytics} disabled={loading}>
                  {loading ? 'Chargement...' : 'Appliquer les Filtres'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grille des Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zoneAnalytics.map((zone, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{zone.zone_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {zone.city}, {zone.country_code}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      Zone
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                        Courses
                      </div>
                      <p className="text-2xl font-bold">{zone.total_rides}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                        Revenus
                      </div>
                      <p className="text-2xl font-bold">{zone.total_revenue.toLocaleString()} CDF</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium">
                        <Users className="w-4 h-4 mr-1 text-purple-600" />
                        Chauffeurs
                      </div>
                      <p className="text-2xl font-bold">{zone.active_drivers}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="w-4 h-4 mr-1 text-orange-600" />
                        Attente
                      </div>
                      <p className="text-2xl font-bold">{zone.average_wait_time}min</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        Satisfaction
                      </div>
                      <Badge variant={zone.customer_satisfaction >= 4 ? "default" : "secondary"}>
                        {zone.customer_satisfaction}/5
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Dernière mise à jour: {new Date(zone.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {zoneAnalytics.length === 0 && !loading && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Aucune donnée disponible pour les filtres sélectionnés</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer une Nouvelle Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-zone-name">Nom de la Zone</Label>
                    <Input id="new-zone-name" placeholder="Ex: Centre-ville Kinshasa" />
                  </div>
                  <div>
                    <Label htmlFor="new-zone-city">Ville</Label>
                    <Input id="new-zone-city" placeholder="Ex: Kinshasa" />
                  </div>
                  <div>
                    <Label htmlFor="new-zone-country">Pays</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="base-price">Prix de Base (CDF)</Label>
                    <Input id="base-price" type="number" placeholder="500" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button>
                    Créer la Zone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Tarifaire par Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configurez les tarifs spécifiques pour chaque zone de service
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price-per-km">Prix par KM (CDF)</Label>
                    <Input id="price-per-km" type="number" placeholder="150" />
                  </div>
                  <div>
                    <Label htmlFor="price-per-minute">Prix par Minute (CDF)</Label>
                    <Input id="price-per-minute" type="number" placeholder="25" />
                  </div>
                  <div>
                    <Label htmlFor="surge-multiplier">Multiplicateur de Pointe</Label>
                    <Input id="surge-multiplier" type="number" step="0.1" placeholder="1.5" />
                  </div>
                </div>

                <Button>
                  Sauvegarder la Tarification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}