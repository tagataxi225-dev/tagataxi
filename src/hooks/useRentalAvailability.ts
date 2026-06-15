import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflictingBookings?: any[];
  message?: string;
}

export interface PriceEstimate {
  base_price: number;
  equipment_total: number;
  security_deposit: number;
  total_price: number;
  duration_hours: number;
  duration_days: number;
  city_multiplier: number;
}

export function useRentalAvailability() {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Vérifier la disponibilité d'un véhicule pour des dates données
   */
  const checkAvailability = async (
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityCheck> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_vehicle_availability' as any, {
        p_vehicle_id: vehicleId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      } as any);

      if (error) throw error;

      return {
        isAvailable: data as boolean,
        message: data 
          ? 'Véhicule disponible' 
          : 'Véhicule non disponible pour ces dates',
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la disponibilité",
        variant: "destructive",
      });
      return {
        isAvailable: false,
        message: 'Erreur lors de la vérification',
      };
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Calculer le prix d'une location
   */
  const calculatePrice = async (
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    city: string,
    equipmentIds: string[] = []
  ): Promise<PriceEstimate | null> => {
    try {
      const { data, error } = await supabase.rpc('calculate_rental_price' as any, {
        p_vehicle_id: vehicleId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_city: city,
        p_equipment_ids: equipmentIds,
      } as any);

      if (error) throw error;

      return data as PriceEstimate;
    } catch (error) {
      console.error('Error calculating price:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer le prix",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Récupérer les dates réservées pour un véhicule (pour affichage dans calendrier)
   */
  const getBookedDates = async (vehicleId: string): Promise<Date[]> => {
    try {
      const { data, error } = await supabase
        .from('rental_bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'pending', 'in_progress']);

      if (error) throw error;

      // Générer toutes les dates entre start et end pour chaque booking
      const bookedDates: Date[] = [];
      data?.forEach((booking: any) => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          bookedDates.push(new Date(d));
        }
      });

      return bookedDates;
    } catch (error) {
      console.error('Error getting booked dates:', error);
      return [];
    }
  };

  /**
   * Calculer les frais de livraison
   */
  const calculateDeliveryFee = async (
    city: string,
    distanceKm: number
  ): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('rental_delivery_fees' as any)
        .select('base_fee, per_km_rate')
        .eq('city', city)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return ((data as any)?.base_fee || 0) + ((data as any)?.per_km_rate || 0) * distanceKm;
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      return 0;
    }
  };

  return {
    isChecking,
    checkAvailability,
    calculatePrice,
    getBookedDates,
    calculateDeliveryFee,
  };
}
