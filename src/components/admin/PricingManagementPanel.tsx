import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeConfigManager } from "./VehicleTypeConfigManager";
import { DynamicPricingManager } from "./pricing/DynamicPricingManager";
import { DollarSign, MapPin, Package } from "lucide-react";

export function PricingManagementPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Tarifs</h2>
        <p className="text-muted-foreground">
          Configurez les prix par ville et type de service
        </p>
      </div>

      <Tabs defaultValue="transport" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Transport VTC
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="dynamic" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tarification Dynamique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport" className="space-y-4">
          <VehicleTypeConfigManager />
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarifs de Livraison</CardTitle>
              <CardDescription>
                Configurez les tarifs Flash, Flex et Maxicharge par ville
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Kinshasa - Tarifs 2025</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Flash</p>
                      <p className="text-lg font-bold">7000 CDF + 500/km</p>
                      <p className="text-xs text-muted-foreground">Livraison express moto</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flex</p>
                      <p className="text-lg font-bold">55000 CDF + 2500/km</p>
                      <p className="text-xs text-muted-foreground">Livraison standard</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maxicharge</p>
                      <p className="text-lg font-bold">100000 CDF + 5000/km</p>
                      <p className="text-xs text-muted-foreground">Gros colis camion</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50 mt-4">
                    <p className="text-xs text-muted-foreground">
                      * Multiplicateurs: Lubumbashi +20%, Kolwezi +10%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4">
          <DynamicPricingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
