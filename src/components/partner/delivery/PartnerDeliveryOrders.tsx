import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { DeliveryOrder } from "@/hooks/usePartnerDeliveries";
import DeliveryOrderCard from "./DeliveryOrderCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  orders: DeliveryOrder[];
  onUpdateStatus: (orderId: string, status: DeliveryOrder["status"]) => void;
  loading?: boolean;
}

export default function PartnerDeliveryOrders({ orders, onUpdateStatus, loading }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DeliveryOrder["status"]>("all");
  const isMobile = useIsMobile();

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipient_phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderCountByStatus = (status: DeliveryOrder["status"]) => {
    return orders.filter(o => o.status === status).length;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes de livraison</CardTitle>
          <CardDescription>
            Gérez toutes les commandes de livraison de votre flotte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par lieu, destinataire, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status tabs */}
      <Tabs 
        defaultValue="all" 
        value={statusFilter} 
        onValueChange={(v) => setStatusFilter(v as any)}
        className="w-full"
      >
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} bg-muted`}>
          <TabsTrigger value="all" className="text-xs">
            Toutes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">
            {isMobile ? '⏳' : 'En attente'} ({getOrderCountByStatus('pending')})
          </TabsTrigger>
          <TabsTrigger value="driver_assigned" className="text-xs">
            {isMobile ? '👤' : 'Assignées'} ({getOrderCountByStatus('driver_assigned')})
          </TabsTrigger>
          {!isMobile && (
            <>
              <TabsTrigger value="picked_up" className="text-xs">
                Récupérées ({getOrderCountByStatus('picked_up')})
              </TabsTrigger>
              <TabsTrigger value="in_transit" className="text-xs">
                En cours ({getOrderCountByStatus('in_transit')})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs">
                Livrées ({getOrderCountByStatus('delivered')})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs">
                Annulées ({getOrderCountByStatus('cancelled')})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Aucune commande ne correspond à votre recherche"
                      : "Aucune commande dans cette catégorie"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
              {filteredOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
