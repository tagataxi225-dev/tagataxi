import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics'
import { useToast } from '@/hooks/use-toast'
import { Wallet, CreditCard, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface DriverFinancialData {
  id: string
  display_name: string
  credits?: {
    balance: number
    total_earned: number
    total_spent: number
  }
  subscription?: {
    status: string
    plan_name: string
    end_date: string
  }
  total_earnings: number
  total_rides: number
}

export const DriverFinancialManager = () => {
  const { fetchDriverAnalytics, exportAnalytics } = useAdminAnalytics()
  const { toast } = useToast()
  const [drivers, setDrivers] = useState<DriverFinancialData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<DriverFinancialData | null>(null)

  const loadDriverFinancials = async () => {
    setLoading(true)
    try {
      const data = await fetchDriverAnalytics()
      setDrivers(data)
    } catch (error) {
      console.error('Error loading driver financials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportAnalytics('drivers')
      toast({
        title: "Export Réussi",
        description: "Les données financières ont été exportées",
        variant: "default"
      })
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'grace_period':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'expired':
        return 'Expiré'
      case 'grace_period':
        return 'Période de Grâce'
      default:
        return 'Inactif'
    }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalActiveSubscriptions = drivers.filter(d => d.subscription?.status === 'active').length
  const totalCreditsBalance = drivers.reduce((sum, d) => sum + (d.credits?.balance || 0), 0)
  const totalRevenue = drivers.reduce((sum, d) => sum + (d.total_earnings || 0), 0)

  useEffect(() => {
    loadDriverFinancials()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion Financière des Chauffeurs</h1>
        <Button onClick={handleExport} variant="outline">
          Exporter les Données
        </Button>
      </div>

      {/* Statistiques Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Chauffeurs</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abonnements Actifs</p>
                <p className="text-2xl font-bold">{totalActiveSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Wallet className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crédits Totaux</p>
                <p className="text-2xl font-bold">{totalCreditsBalance.toLocaleString()} CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus Totaux</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="credits">Gestion des Crédits</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="earnings">Revenus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Liste des Chauffeurs</CardTitle>
                <div className="w-64">
                  <Input
                    placeholder="Rechercher un chauffeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Solde Crédits</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Revenus Totaux</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        {driver.display_name || 'Nom non disponible'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-4 h-4 text-purple-600" />
                          <span>{driver.credits?.balance?.toLocaleString() || 0} CDF</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(driver.subscription?.status || 'inactive')}
                          <Badge variant={driver.subscription?.status === 'active' ? 'default' : 'secondary'}>
                            {getStatusLabel(driver.subscription?.status || 'inactive')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {driver.total_earnings?.toLocaleString() || 0} CDF
                      </TableCell>
                      <TableCell>
                        {driver.total_rides || 0}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDriver(driver)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDrivers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun chauffeur trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Crédits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="driver-search">Rechercher Chauffeur</Label>
                    <Input
                      id="driver-search"
                      placeholder="Nom du chauffeur"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="credit-amount">Montant (CDF)</Label>
                    <Input
                      id="credit-amount"
                      type="number"
                      placeholder="5000"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button variant="outline">
                      Ajouter Crédits
                    </Button>
                    <Button variant="destructive">
                      Déduire Crédits
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Chauffeurs avec Solde Faible</h3>
                  <div className="space-y-2">
                    {drivers
                      .filter(d => (d.credits?.balance || 0) < 1000)
                      .map(driver => (
                        <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="font-medium">{driver.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Solde: {driver.credits?.balance || 0} CDF
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Recharger
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Abonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold">Abonnements Actifs</p>
                      <p className="text-2xl font-bold text-green-600">{totalActiveSubscriptions}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="font-semibold">Période de Grâce</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {drivers.filter(d => d.subscription?.status === 'grace_period').length}
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="font-semibold">Expirés</p>
                      <p className="text-2xl font-bold text-red-600">
                        {drivers.filter(d => d.subscription?.status === 'expired').length}
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Abonnements Expirant Bientôt</h3>
                  <div className="space-y-2">
                    {drivers
                      .filter(d => {
                        if (!d.subscription?.end_date) return false
                        const endDate = new Date(d.subscription.end_date)
                        const today = new Date()
                        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
                        return diffDays <= 3 && diffDays > 0
                      })
                      .map(driver => (
                        <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="font-medium">{driver.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Expire le: {new Date(driver.subscription?.end_date || '').toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Renouveler
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Top Performers</h3>
                    <div className="space-y-2">
                      {drivers
                        .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
                        .slice(0, 5)
                        .map((driver, index) => (
                          <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div>
                                <p className="font-medium">{driver.display_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {driver.total_rides} courses
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{driver.total_earnings?.toLocaleString()} CDF</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Statistiques</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span>Revenus Moyens par Chauffeur</span>
                        <span className="font-bold">
                          {drivers.length > 0 ? Math.round(totalRevenue / drivers.length).toLocaleString() : 0} CDF
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span>Courses Moyennes par Chauffeur</span>
                        <span className="font-bold">
                          {drivers.length > 0 ? Math.round(drivers.reduce((sum, d) => sum + (d.total_rides || 0), 0) / drivers.length) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span>Revenus par Course (Moyenne)</span>
                        <span className="font-bold">
                          {drivers.length > 0 ? Math.round(totalRevenue / drivers.reduce((sum, d) => sum + (d.total_rides || 0), 0) || 1).toLocaleString() : 0} CDF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}