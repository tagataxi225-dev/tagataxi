import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePartnerDeliveries } from "@/hooks/usePartnerDeliveries";
import PartnerDeliveryOrders from "./PartnerDeliveryOrders";
import PartnerDeliveryDrivers from "./PartnerDeliveryDrivers";
import PartnerDeliveryStats from "./PartnerDeliveryStats";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PartnerDeliveryManager() {
  const { 
    orders, 
    drivers, 
    isLoading, 
    updateOrderStatus, 
    toggleDriverStatus 
  } = usePartnerDeliveries();
  
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className={`grid w-full grid-cols-3 rounded-2xl bg-grey-50 border border-grey-100 p-1 ${isMobile ? 'h-12' : 'h-14'} shadow-sm`}>
          <TabsTrigger 
            value="orders" 
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            📦 Commandes
          </TabsTrigger>
          <TabsTrigger 
            value="drivers"
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            🚴 Livreurs
          </TabsTrigger>
          <TabsTrigger 
            value="stats"
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            📊 Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <PartnerDeliveryOrders
            orders={orders}
            onUpdateStatus={(orderId, status) => updateOrderStatus.mutate({ orderId, status })}
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <PartnerDeliveryDrivers
            drivers={drivers}
            onToggleStatus={(driverId, isActive) => 
              toggleDriverStatus.mutate({ driverId, isActive })
            }
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <PartnerDeliveryStats orders={orders} drivers={drivers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
