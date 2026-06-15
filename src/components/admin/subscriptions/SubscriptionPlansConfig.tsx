import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DriverSubscriptionPlans } from './DriverSubscriptionPlans'
import { RentalSubscriptionPlans } from './RentalSubscriptionPlans'
import { RentalSubscriptionPlansByCategory } from './RentalSubscriptionPlansByCategory'
import { RestaurantSubscriptionPlansAdmin } from './RestaurantSubscriptionPlansAdmin'
import { VendorSubscriptionPlansAdmin } from './VendorSubscriptionPlansAdmin'
import { AdminSubscriptionRevenue } from './AdminSubscriptionRevenue'
import { useDriverSubscriptionPlans } from '@/hooks/useDriverSubscriptionPlans'
import { useRentalSubscriptionPlans } from '@/hooks/useRentalSubscriptionPlans'
import { useRestaurantSubscriptionPlansAdmin } from '@/hooks/useRestaurantSubscriptionPlansAdmin'
import { useVendorSubscriptionPlansAdmin } from '@/hooks/useVendorSubscriptionPlansAdmin'
import { Car, Building2, Grid3x3, UtensilsCrossed, ShoppingBag } from 'lucide-react'

export const SubscriptionPlansConfig = () => {
  const [activeTab, setActiveTab] = useState('drivers')
  const { plans: driverPlans } = useDriverSubscriptionPlans()
  const { plans: rentalPlans } = useRentalSubscriptionPlans()
  const { plans: restaurantPlans } = useRestaurantSubscriptionPlansAdmin()
  const { plans: vendorPlans } = useVendorSubscriptionPlansAdmin()

  const driverActivePlans = driverPlans.filter(p => p.is_active).length
  const rentalActivePlans = rentalPlans.filter(p => p.is_active).length
  const restaurantActivePlans = restaurantPlans.filter(p => p.is_active).length
  const vendorActivePlans = vendorPlans.filter(p => p.is_active).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration des Plans d'Abonnement</h1>
        <p className="text-muted-foreground mt-2">
          Gérez tous les plans d'abonnement par secteur d'activité
        </p>
      </div>

      <AdminSubscriptionRevenue />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs/Livreurs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverActivePlans}</div>
            <p className="text-xs text-muted-foreground">plans actifs sur {driverPlans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Partenaires</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentalActivePlans}</div>
            <p className="text-xs text-muted-foreground">plans actifs sur {rentalPlans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurantActivePlans}</div>
            <p className="text-xs text-muted-foreground">plans actifs sur {restaurantPlans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs Marketplace</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorActivePlans}</div>
            <p className="text-xs text-muted-foreground">plans actifs sur {vendorPlans.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Chauffeurs
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="rental-categories" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Par Catégorie
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Vendeurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <DriverSubscriptionPlans />
        </TabsContent>
        <TabsContent value="rental" className="mt-6">
          <RentalSubscriptionPlans />
        </TabsContent>
        <TabsContent value="rental-categories" className="mt-6">
          <RentalSubscriptionPlansByCategory />
        </TabsContent>
        <TabsContent value="restaurants" className="mt-6">
          <RestaurantSubscriptionPlansAdmin />
        </TabsContent>
        <TabsContent value="vendors" className="mt-6">
          <VendorSubscriptionPlansAdmin />
        </TabsContent>
      </Tabs>
    </div>
  )
}
