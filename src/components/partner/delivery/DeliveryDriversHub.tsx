import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Zap, Package, Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import PartnerDeliveryDrivers from '../rental/PartnerDeliveryDrivers';
import PartnerTruckDrivers from '../rental/PartnerTruckDrivers';

const categories = [
  {
    id: 'flash',
    label: 'Flash',
    icon: Zap,
    color: 'text-red-500',
    bgActive: 'data-[state=active]:text-red-600',
    desc: 'Moto · Express',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    id: 'flex',
    label: 'Flex',
    icon: Package,
    color: 'text-orange-500',
    bgActive: 'data-[state=active]:text-orange-600',
    desc: 'Camionnette · Standard',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'maxi',
    label: 'MaxiCharge',
    icon: Truck,
    color: 'text-amber-600',
    bgActive: 'data-[state=active]:text-amber-700',
    desc: 'Camion · Gros volumes',
    gradient: 'from-amber-500 to-yellow-500',
  },
];

export const DeliveryDriversHub = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="flash" className="w-full">
        <TabsList className={`grid w-full grid-cols-3 rounded-2xl bg-muted/50 border border-border/50 p-1.5 ${isMobile ? 'h-14' : 'h-16'} shadow-sm`}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className={cn(
                  'rounded-xl transition-all duration-200 font-medium',
                  'data-[state=active]:bg-background data-[state=active]:shadow-md',
                  'hover:bg-background/50',
                  cat.bgActive,
                  isMobile ? 'flex-col gap-0.5 py-1.5 px-1 text-xs' : 'flex-row gap-2 py-2 px-3 text-sm'
                )}
              >
                <div className={`data-[state=active]:p-0 ${isMobile ? '' : 'p-0'}`}>
                  <Icon className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
                </div>
                <span className="font-semibold">{cat.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Flash */}
        <TabsContent value="flash" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Livreurs Flash</h3>
              <p className="text-xs text-muted-foreground">Moto-livreurs express</p>
            </div>
            <Badge variant="outline" className="ml-auto border-red-200 text-red-600 bg-red-50 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400">
              Express
            </Badge>
          </div>
          <PartnerDeliveryDrivers />
        </TabsContent>

        {/* Flex */}
        <TabsContent value="flex" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Livreurs Flex</h3>
              <p className="text-xs text-muted-foreground">Camionnettes standard</p>
            </div>
            <Badge variant="outline" className="ml-auto border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400">
              Standard
            </Badge>
          </div>
          <PartnerTruckDrivers />
        </TabsContent>

        {/* MaxiCharge */}
        <TabsContent value="maxi" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Livreurs MaxiCharge</h3>
              <p className="text-xs text-muted-foreground">Camions — gros volumes</p>
            </div>
            <Badge variant="outline" className="ml-auto border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
              Lourd
            </Badge>
          </div>
          <PartnerTruckDrivers />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
