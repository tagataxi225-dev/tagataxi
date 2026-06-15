import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Package, Truck, Users, Car } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import PartnerDeliveryDrivers from './rental/PartnerDeliveryDrivers';
import PartnerTruckDrivers from './rental/PartnerTruckDrivers';
import { PartnerDriverManager } from './PartnerDriverManager';
import { PartnerTaxiVehicleList } from './taxi/PartnerTaxiVehicleList';

type DriverCategory = 'flash' | 'flex' | 'maxi' | 'chauffeurs' | 'vehicles';

const categories = [
  { 
    id: 'flash' as DriverCategory, 
    label: 'Flash', 
    icon: Zap, 
    color: 'text-red-500',
    activeBg: 'data-[state=active]:text-red-600',
    description: 'Moto - Livraison express'
  },
  { 
    id: 'flex' as DriverCategory, 
    label: 'Flex', 
    icon: Package, 
    color: 'text-green-500',
    activeBg: 'data-[state=active]:text-green-600',
    description: 'Camionnette - Standard'
  },
  { 
    id: 'maxi' as DriverCategory, 
    label: 'MaxiCharge', 
    icon: Truck, 
    color: 'text-violet-500',
    activeBg: 'data-[state=active]:text-violet-600',
    description: 'Camion - Gros volumes'
  },
  { 
    id: 'chauffeurs' as DriverCategory, 
    label: 'Chauffeurs', 
    icon: Users, 
    color: 'text-blue-500',
    activeBg: 'data-[state=active]:text-blue-600',
    description: 'Chauffeurs taxi / VTC'
  },
  { 
    id: 'vehicles' as DriverCategory, 
    label: 'Véhicules', 
    icon: Car, 
    color: 'text-orange-500',
    activeBg: 'data-[state=active]:text-orange-600',
    description: 'Flotte taxi / VTC'
  },
];

export const PartnerDriversHub = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="flash" className="w-full">
      <TabsList className={`grid w-full grid-cols-5 rounded-2xl bg-grey-50 border border-grey-100 p-1 ${isMobile ? 'h-12' : 'h-14'} shadow-sm`}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className={`rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-1 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50 ${cat.activeBg}`}
            >
              <Icon className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
              {isMobile ? cat.label : cat.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Flash - Moto delivery */}
      <TabsContent value="flash" className="space-y-4 mt-4">
        <PartnerDeliveryDrivers />
      </TabsContent>

      {/* Flex - Camionnette (reuses truck drivers with van/camionnette filter) */}
      <TabsContent value="flex" className="space-y-4 mt-4">
        <PartnerTruckDrivers />
      </TabsContent>

      {/* MaxiCharge - Camion */}
      <TabsContent value="maxi" className="space-y-4 mt-4">
        <PartnerTruckDrivers />
      </TabsContent>

      {/* Chauffeurs - Generic driver manager */}
      <TabsContent value="chauffeurs" className="space-y-4 mt-4">
        <PartnerDriverManager />
      </TabsContent>

      {/* Véhicules - Taxi vehicle fleet */}
      <TabsContent value="vehicles" className="space-y-4 mt-4">
        <PartnerTaxiVehicleList />
      </TabsContent>
    </Tabs>
  );
};
