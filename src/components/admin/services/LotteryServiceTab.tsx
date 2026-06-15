import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap } from 'lucide-react';

interface LotteryServiceTabProps {
  services: any[];
  onToggleStatus: (id: string, status: boolean) => void;
}

export const LotteryServiceTab = ({ services, onToggleStatus }: LotteryServiceTabProps) => {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <CardTitle>Loterie TembeaPay</CardTitle>
            </div>
            <CardDescription>
              Système de récompenses avec tickets gratuits
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

      <TabsContent value="config">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Tickets</CardTitle>
              <CardDescription>
                Distribution automatique de tickets selon les actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Par course terminée</div>
                    <div className="text-sm text-muted-foreground">Ticket automatique</div>
                  </div>
                  <Badge>1 ticket</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Par parrainage réussi</div>
                    <div className="text-sm text-muted-foreground">Bonus parrainage</div>
                  </div>
                  <Badge>2 tickets</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Par achat marketplace</div>
                    <div className="text-sm text-muted-foreground">Shopping bonus</div>
                  </div>
                  <Badge>1 ticket</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tirages & Récompenses</CardTitle>
              <CardDescription>
                Fréquence et montants des récompenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Fréquence tirages</div>
                    <div className="text-sm text-muted-foreground">Automatique</div>
                  </div>
                  <Badge variant="outline">Quotidien</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Récompense minimum</div>
                    <div className="text-sm text-muted-foreground">Crédits TembeaPay</div>
                  </div>
                  <Badge variant="outline">1,000 CDF</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};
