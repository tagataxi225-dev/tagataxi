import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id: string | null;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  package_details: any;
  recipient_name: string;
  recipient_phone: string;
  estimated_price: number;
  final_price: number | null;
  status: string;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryDriver {
  id: string;
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  vehicle_type: string | null;
  vehicle_class: string | null;
  license_plate: string | null;
  is_active: boolean;
  total_deliveries: number;
  average_rating: number | null;
  partner_id: string | null;
}

export function usePartnerDeliveries() {
  const qc = useQueryClient();

  const userQuery = useQuery<any>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const userId = userQuery.data?.id as string | undefined;

  // Get partner ID
  const partnerQuery = useQuery<string | null>({
    queryKey: ["partner-id", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (error || !data) return null;
      return data.id;
    },
    enabled: !!userId,
  });

  const partnerId = partnerQuery.data;

  // Fetch delivery orders for partner's drivers
  const ordersQuery = useQuery({
    queryKey: ["partner-delivery-orders", partnerId],
    queryFn: async (): Promise<any[]> => {
      if (!partnerId) return [];

      // Get all driver IDs for this partner
      const { data: driversData, error: driversError } = await (supabase as any)
        .from("driver_profiles")
        .select("user_id")
        .eq("partner_id", partnerId);

      if (driversError || !driversData || driversData.length === 0) return [];

      const driverIds = driversData.map((d: any) => d.user_id);

      // Get all delivery orders for these drivers
      const { data, error } = await (supabase as any)
        .from("delivery_orders")
        .select("*")
        .in("driver_id", driverIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  // Fetch partner's delivery drivers
  const driversQuery = useQuery({
    queryKey: ["partner-delivery-drivers", partnerId],
    queryFn: async (): Promise<any[]> => {
      if (!partnerId) return [];

      const { data, error } = await (supabase as any)
        .from("driver_profiles")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: DeliveryOrder["status"] }) => {
      const { data, error } = await supabase
        .from("delivery_orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour avec succès");
      qc.invalidateQueries({ queryKey: ["partner-delivery-orders", partnerId] });
    },
    onError: (error: any) => {
      console.error("Error updating order status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });

  // Toggle driver active status
  const toggleDriverStatus = useMutation({
    mutationFn: async ({ driverId, isActive }: { driverId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("driver_profiles")
        .update({ is_active: isActive })
        .eq("user_id", driverId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["partner-delivery-drivers", partnerId] });
    },
    onError: (error: any) => {
      console.error("Error toggling driver status:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel("delivery-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_orders" },
        (payload) => {
          console.log("delivery_orders change", payload);
          qc.invalidateQueries({ queryKey: ["partner-delivery-orders", partnerId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_profiles" },
        (payload) => {
          console.log("driver_profiles change", payload);
          qc.invalidateQueries({ queryKey: ["partner-delivery-drivers", partnerId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, qc]);

  return useMemo(
    () => ({
      user: userQuery.data,
      partnerId,
      orders: (ordersQuery.data || []) as DeliveryOrder[],
      drivers: (driversQuery.data || []) as DeliveryDriver[],
      isLoading: ordersQuery.isLoading || driversQuery.isLoading,
      updateOrderStatus,
      toggleDriverStatus,
    }),
    [
      userQuery.data,
      partnerId,
      ordersQuery.data,
      driversQuery.data,
      ordersQuery.isLoading,
      driversQuery.isLoading,
      updateOrderStatus,
      toggleDriverStatus,
    ]
  );
}
