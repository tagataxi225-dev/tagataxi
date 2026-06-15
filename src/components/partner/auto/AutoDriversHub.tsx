import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Car } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PartnerDriverManager } from '../PartnerDriverManager';
import { PartnerTaxiVehicleList } from '../taxi/PartnerTaxiVehicleList';
import { cn } from '@/lib/utils';

export const AutoDriversHub = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="chauffeurs" className="w-full">
        <TabsList className={`grid w-full grid-cols-2 rounded-2xl bg-muted/50 border border-border/50 p-1.5 ${isMobile ? 'h-14' : 'h-16'} shadow-sm`}>
          <TabsTrigger
            value="chauffeurs"
            className={cn(
              'rounded-xl transition-all duration-200 font-medium',
              'data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-blue-600',
              'hover:bg-background/50',
              isMobile ? 'flex-col gap-0.5 py-1.5 text-xs' : 'flex-row gap-2 py-2 text-sm'
            )}
          >
            <Users className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
            <span className="font-semibold">Chauffeurs</span>
          </TabsTrigger>

          <TabsTrigger
            value="vehicules"
            className={cn(
              'rounded-xl transition-all duration-200 font-medium',
              'data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-violet-600',
              'hover:bg-background/50',
              isMobile ? 'flex-col gap-0.5 py-1.5 text-xs' : 'flex-row gap-2 py-2 text-sm'
            )}
          >
            <Car className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
            <span className="font-semibold">Véhicules</span>
          </TabsTrigger>
        </TabsList>

        {/* Chauffeurs */}
        <TabsContent value="chauffeurs" className="mt-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Chauffeurs Taxi / VTC</h3>
              <p className="text-xs text-muted-foreground">Gérez vos conducteurs</p>
            </div>
            <Badge variant="outline" className="ml-auto border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400">
              Transport
            </Badge>
          </div>
          <PartnerDriverManager />
        </TabsContent>

        {/* Véhicules */}
        <TabsContent value="vehicules" className="mt-3 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Flotte Taxi / VTC</h3>
              <p className="text-xs text-muted-foreground">Gestion de vos véhicules</p>
            </div>
            <Badge variant="outline" className="ml-auto border-violet-200 text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800 dark:text-violet-400">
              Flotte
            </Badge>
          </div>
          <PartnerTaxiVehicleList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
