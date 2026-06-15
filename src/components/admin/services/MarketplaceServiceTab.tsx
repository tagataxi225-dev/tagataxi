import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { EscrowManagementPanel } from '../marketplace/EscrowManagementPanel';

interface MarketplaceServiceTabProps {
  services: any[];
  pricing: any[];
  onToggleStatus: (id: string, status: boolean) => void;
}

export const MarketplaceServiceTab = ({ services, pricing, onToggleStatus }: MarketplaceServiceTabProps) => {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="commission">Commission</TabsTrigger>
        <TabsTrigger value="escrow">Escrow</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Marketplace E-commerce</CardTitle>
            <CardDescription>
              Plateforme de vente intégrée avec livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.map((service) => (
              <div key={service.id} className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{service.display_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {service.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => onToggleStatus(service.id, service.is_active)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="commission">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Commission Vendeurs</CardTitle>
            <CardDescription>
              Taux de commission appliqué aux ventes sur la marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pricing.filter(p => p.service_category === 'marketplace').map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{p.city}</div>
                    <div className="text-sm text-muted-foreground">
                      Commission vendeur: {p.commission_rate}%
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="escrow">
        <EscrowManagementPanel />
      </TabsContent>
    </Tabs>
  );
};
