
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaxiVehicle {
  id: string;
  partner_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_class: string;
  requested_classes?: string[];
  approved_classes?: string[];
  color: string | null;
  seats: number;
  images: string[];
  license_plate: string;
  is_active: boolean;
  is_available: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  assigned_driver_id?: string | null;
  ownership_type: "partner" | "driver" | "third_party";
  owner_name?: string | null;
  owner_phone?: string | null;
  chassis_number?: string | null;
  insurance_expiry?: string | null;
  inspection_expiry?: string | null;
  document_urls?: Record<string, string>[];
  admin_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
}

export function usePartnerTaxiVehicles() {
  const qc = useQueryClient();

  const userQuery = useQuery<any>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const userId = userQuery.data?.id as string | undefined;

  const partenaireQuery = useQuery<string | null>({
    queryKey: ["partenaire-id", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!userId,
  });

  const partenaireId = partenaireQuery.data ?? undefined;

  const vehiclesQuery = useQuery<TaxiVehicle[]>({
    queryKey: ["partner-taxi-vehicles", partenaireId],
    queryFn: async () => {
      if (!partenaireId) return [] as TaxiVehicle[];
      const { data, error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .select("*")
        .eq("partner_id", partenaireId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        images: Array.isArray(v.images) ? v.images.map((s: any) => String(s)) : [],
      })) as TaxiVehicle[];
    },
    enabled: !!partenaireId,
  });

  const createVehicle = useMutation({
    mutationFn: async (payload: Partial<TaxiVehicle>) => {
      if (!partenaireId) throw new Error("Profil partenaire introuvable");
      const insert = {
        ...payload,
        partner_id: partenaireId,
        vehicle_class: payload.vehicle_class || "eco",
        seats: payload.seats ?? 4,
        images: payload.images || [],
        is_active: true,
        is_available: true,
        moderation_status: "pending",
      };
      const { data, error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .insert(insert as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TaxiVehicle;
    },
    meta: { onError: (e: any) => console.error("create taxi error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-taxi-vehicles", partenaireId] });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaxiVehicle> }) => {
      const { data, error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TaxiVehicle;
    },
    meta: { onError: (e: any) => console.error("update taxi error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-taxi-vehicles", partenaireId] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("partner_taxi_vehicles").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    meta: { onError: (e: any) => console.error("delete taxi error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-taxi-vehicles", partenaireId] });
    },
  });

  const assignDriverToVehicle = useMutation({
    mutationFn: async ({ vehicleId, driverId }: { vehicleId: string; driverId: string | null }) => {
      if (driverId) {
        const { error: unassignError } = await (supabase as any)
          .from("partner_taxi_vehicles")
          .update({ assigned_driver_id: null })
          .eq("assigned_driver_id", driverId)
          .neq("id", vehicleId);
        if (unassignError) throw unassignError;
      }
      const { error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .update({ assigned_driver_id: driverId })
        .eq("id", vehicleId);
      if (error) throw error;
      return true;
    },
    meta: { onError: (e: any) => console.error("assign driver error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-taxi-vehicles", partenaireId] });
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("partner-taxi-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_taxi_vehicles" },
        (payload) => {
          console.log("partner_taxi_vehicles change", payload);
          qc.invalidateQueries({ queryKey: ["partner-taxi-vehicles", partenaireId] });
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
      vehicles: vehiclesQuery.data || [],
      isLoading: userQuery.isLoading || partenaireQuery.isLoading || vehiclesQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      assignDriverToVehicle,
    }),
    [
      userQuery.data,
      userQuery.isLoading,
      partenaireQuery.isLoading,
      vehiclesQuery.data,
      vehiclesQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      assignDriverToVehicle,
    ]
  );
}
