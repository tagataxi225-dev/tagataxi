import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendRentalStatusNotification, formatDateForNotification } from "@/services/rentalNotificationService";
import { toast } from "sonner";

export interface VehicleCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
}

export interface RentalVehicle {
  id: string;
  partner_id: string;
  category_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  fuel_type: string | null;
  transmission: string | null;
  seats: number;
  daily_rate: number;
  hourly_rate: number;
  weekly_rate: number;
  security_deposit: number;
  driver_available?: boolean;
  driver_required?: boolean;
  with_driver_daily_rate?: number;
  with_driver_hourly_rate?: number;
  with_driver_weekly_rate?: number;
  without_driver_daily_rate?: number;
  without_driver_hourly_rate?: number;
  without_driver_weekly_rate?: number;
  driver_equipment?: string[];
  vehicle_equipment?: string[];
  features: string[];
  images: string[];
  license_plate: string | null;
  location_address: string | null;
  city?: string;
  available_cities?: string[];
  comfort_level?: string;
  equipment?: string[];
  is_active: boolean;
  is_available: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  rental_duration_type: "hourly" | "half_day" | "daily" | "weekly";
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  total_amount: number;
  security_deposit: number;
  special_requests: string | null;
  status: "pending" | "approved_by_partner" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected" | "no_show";
  payment_status?: "pending" | "paid" | "refunded";
  created_at: string;
  updated_at: string;
}

export function usePartnerRentals() {
  const qc = useQueryClient();

  // Keep the typing simple to avoid deep instantiation
  const userQuery = useQuery<any>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const userId = userQuery.data?.id as string | undefined;

  const categoriesQuery = useQuery<VehicleCategory[]>({
    queryKey: ["rental-categories"],
    queryFn: async () => {
      console.log('🔍 [usePartnerRentals] Fetching categories...');
      const { data, error } = await supabase
        .from("rental_vehicle_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error('❌ [usePartnerRentals] Categories fetch error:', error);
        throw error;
      }
      
      console.log('✅ [usePartnerRentals] Categories loaded:', data?.length || 0, data);
      return (data || []) as VehicleCategory[];
    },
    enabled: true,
  });

  const vehiclesQuery = useQuery<RentalVehicle[]>({
    queryKey: ["partner-rental-vehicles", userId],
    queryFn: async () => {
      if (!userId) return [] as RentalVehicle[];
      
      // First get partner_id from user_id
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (partnerError || !partnerData) return [] as RentalVehicle[];
      
      const { data, error } = await (supabase as any)
        .from("rental_vehicles")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        features: Array.isArray(v.features) ? v.features.map((x: any) => String(x)) : [],
        images: Array.isArray(v.images) ? v.images.map((x: any) => String(x)) : [],
      })) as RentalVehicle[];
    },
    enabled: !!userId,
  });

  const bookingsQuery = useQuery<RentalBooking[]>({
    queryKey: ["partner-rental-bookings", userId],
    queryFn: async () => {
      if (!userId) {
        console.log('⚠️ [PARTNER BOOKINGS] No userId, returning empty');
        return [] as RentalBooking[];
      }

      // First get partner_id
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      console.log('🔍 [PARTNER BOOKINGS] Partner data:', partnerData, 'Error:', partnerError);
      
      if (partnerError || !partnerData) {
        console.log('⚠️ [PARTNER BOOKINGS] No partner found for user');
        return [] as RentalBooking[];
      }

      const { data: vehicleIdsData, error: idsErr } = await (supabase as any)
        .from("rental_vehicles")
        .select("id")
        .eq("partner_id", partnerData.id);

      if (idsErr) throw idsErr;

      const vehicleIds = (vehicleIdsData || []).map((r: any) => r.id);
      console.log('🔍 [PARTNER BOOKINGS] Vehicle IDs:', vehicleIds);
      
      if (vehicleIds.length === 0) {
        console.log('⚠️ [PARTNER BOOKINGS] No vehicles found for partner');
        return [] as RentalBooking[];
      }

      const { data, error } = await (supabase as any)
        .from("rental_bookings")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ [PARTNER BOOKINGS] Error fetching bookings:', error);
        throw error;
      }
      
      console.log('📋 [PARTNER BOOKINGS] Found bookings:', data?.length || 0, data);
      return (data || []) as RentalBooking[];
    },
    enabled: !!userId && !!vehiclesQuery.data,
  });

  // Mutations
  const createVehicle = useMutation({
    mutationFn: async (payload: Partial<RentalVehicle>) => {
      if (!userId) throw new Error("Not authenticated");
      
      // Get partner_id first
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (partnerError || !partnerData) throw new Error("Partner not found");
      
      const insert = {
        ...payload,
        partner_id: partnerData.id,
        features: payload.features || [],
        images: payload.images || [],
      };
      // Cast to any to avoid friction with generated Insert typing requiring all mandatory fields at compile-time
      const { data, error } = await supabase
        .from("rental_vehicles")
        .insert(insert as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as RentalVehicle;
    },
    meta: { onError: (e: any) => console.error("createVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RentalVehicle> }) => {
      const { data, error } = await supabase
        .from("rental_vehicles")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as RentalVehicle;
    },
    meta: { onError: (e: any) => console.error("updateVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_vehicles").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    meta: { onError: (e: any) => console.error("deleteVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RentalBooking["status"] }) => {
      // INTERCEPTION : passage en "in_progress" = prise du vehicule
      // -> on appelle l'edge function qui verse au partenaire (net commission)
      // et passe la reservation en in_progress. On ne fait PAS le simple update.
      if (status === "in_progress") {
        const { data: payoutData, error: payoutError } = await supabase.functions.invoke(
          "rental-pickup-payout",
          { body: { booking_id: id } }
        );
        if (payoutError) throw payoutError;
        if (payoutData && payoutData.success === false) {
          throw new Error(payoutData.error || "Echec du versement partenaire");
        }
        // Notifier le client du demarrage
        const { data: bk } = await (supabase as any)
          .from("rental_bookings")
          .select("user_id, vehicle_id, total_amount, start_date, end_date")
          .eq("id", id)
          .single();
        if (bk?.user_id && bk?.vehicle_id) {
          const { data: veh } = await (supabase as any)
            .from("rental_vehicles")
            .select("brand, model")
            .eq("id", bk.vehicle_id)
            .single();
          if (veh) {
            await sendRentalStatusNotification({
              booking_id: id,
              user_id: bk.user_id,
              vehicle_name: `${veh.brand} ${veh.model}`,
              status: "in_progress",
              total_amount: bk.total_amount,
              start_date: formatDateForNotification(bk.start_date),
              end_date: formatDateForNotification(bk.end_date)
            });
          }
        }
        return { id, status: "in_progress" } as unknown as RentalBooking;
      }

      // INTERCEPTION : annulation/rejet par le partenaire
      // -> remboursement integral du client via l'edge function
      if (status === "rejected" || status === "cancelled") {
        const { data: cancelData, error: cancelError } = await supabase.functions.invoke(
          "rental-cancellation",
          { body: { booking_id: id, cancelled_by: "partner" } }
        );
        if (cancelError) throw cancelError;
        if (cancelData && cancelData.success === false) {
          throw new Error(cancelData.error || "Echec de l'annulation");
        }
        return { id, status: "cancelled" } as unknown as RentalBooking;
      }

      // 1. Mettre à jour le statut
      const { data, error } = await supabase
        .from("rental_bookings")
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      const booking = data as any;

      // 2. Récupérer les infos du véhicule pour la notification
      const { data: vehicleData } = await (supabase as any)
        .from("rental_vehicles")
        .select("brand, model")
        .eq("id", booking.vehicle_id)
        .single();

      // 3. Envoyer notification au client
      if (vehicleData && booking.user_id) {
        const vehicleName = `${vehicleData.brand} ${vehicleData.model}`;
        await sendRentalStatusNotification({
          booking_id: booking.id,
          user_id: booking.user_id,
          vehicle_name: vehicleName,
          status,
          total_amount: booking.total_amount,
          start_date: formatDateForNotification(booking.start_date),
          end_date: formatDateForNotification(booking.end_date)
        });
      }

      return data as unknown as RentalBooking;
    },
    meta: { onError: (e: any) => console.error("updateBookingStatus error", e) },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["partner-rental-bookings", userId] });
      
      // Toast de confirmation pour le partenaire
      const statusLabels: Record<string, string> = {
        approved_by_partner: '✅ Disponibilité confirmée ! Le client peut maintenant payer.',
        confirmed: '✅ Location confirmée et payée !',
        rejected: '❌ Location rejetée. Le client a été notifié.',
        in_progress: '🚗 Location démarrée ! Le client a été notifié.',
        completed: '🏁 Location terminée ! Le client a été notifié.',
        no_show: '⏰ Absence signalée. Le client a été notifié.',
        cancelled: '⚠️ Location annulée. Le client a été notifié.'
      };
      
      toast.success(statusLabels[variables.status] || 'Statut mis à jour !');
    },
  });

  // Realtime: invalider quand changement
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("rental-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_vehicles" },
        (payload) => {
          console.log("rental_vehicles change", payload);
          qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_bookings" },
        (payload) => {
          console.log("rental_bookings change", payload);
          qc.invalidateQueries({ queryKey: ["partner-rental-bookings", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return useMemo(
    () => ({
      user: userQuery.data,
      categories: categoriesQuery.data || [],
      vehicles: vehiclesQuery.data || [],
      bookings: bookingsQuery.data || [],
      isLoading: categoriesQuery.isLoading || vehiclesQuery.isLoading || bookingsQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      updateBookingStatus,
    }),
    [
      userQuery.data,
      categoriesQuery.data,
      vehiclesQuery.data,
      bookingsQuery.data,
      categoriesQuery.isLoading,
      vehiclesQuery.isLoading,
      bookingsQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      updateBookingStatus,
    ]
  );
}
