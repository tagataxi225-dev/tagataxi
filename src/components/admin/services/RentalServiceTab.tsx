import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Settings } from 'lucide-react';

interface RentalServiceTabProps {
  services: any[];
  pricing: any[];
  onEditService: (service: any) => void;
  onToggleStatus: (id: string, status: boolean) => void;
}

export const RentalServiceTab = ({ services, pricing, onEditService, onToggleStatus }: RentalServiceTabProps) => {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="commission">Commission</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.display_name}</CardTitle>
                  {!service.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      Inactif
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Caractéristiques</div>
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 3).map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => onToggleStatus(service.id, service.is_active)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditService(service)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="commission">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Commission</CardTitle>
            <CardDescription>
              Taux de commission appliqué aux réservations de location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pricing.filter(p => p.service_category === 'rental').map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{p.city}</div>
                    <div className="text-sm text-muted-foreground">
                      Commission: {p.commission_rate}%
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
    </Tabs>
  );
};
