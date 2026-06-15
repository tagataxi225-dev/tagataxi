import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============ INTERFACES ============

export interface RentalVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  daily_rate: number;
  is_available: boolean;
  is_active: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  category_id?: string;
  category_name?: string;
  partner_id?: string;
  partner_name?: string;
  city?: string;
  image_url?: string;
  created_at: string;
}

export interface RentalBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  vehicle_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  client_name?: string;
  client_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
}

export interface RentalPartner {
  id: string;
  user_id: string;
  company_name: string;
  display_name: string;
  phone_number: string;
  email: string;
  city: string;
  verification_status: string;
  is_active: boolean;
  vehicles_count: number;
  bookings_count: number;
  total_revenue: number;
  created_at: string;
}

export interface RentalVehicleFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  category?: string;
  city?: string;
  availability?: 'all' | 'available' | 'unavailable';
  search?: string;
}

export interface RentalBookingFilters {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
  search?: string;
}

export interface RentalPartnerFilters {
  verificationStatus?: string;
  city?: string;
  activeOnly?: boolean;
  search?: string;
}

// ============ HOOK PRINCIPAL ============

export const useRentalAnalytics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============ VEHICLES ============

  const useVehicles = (filters: RentalVehicleFilters = {}) => {
    return useQuery({
      queryKey: ['rentalVehicles', filters],
      queryFn: async () => {
        let query = supabase
          .from('rental_vehicles')
          .select(`
            *,
            rental_vehicle_categories!left(name),
            partenaires!left(company_name, city)
          `)
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'all') {
          query = query.eq('moderation_status', filters.status);
        }
        if (filters.category) {
          query = query.eq('category_id', filters.category);
        }
        if (filters.availability === 'available') {
          query = query.eq('is_available', true);
        } else if (filters.availability === 'unavailable') {
          query = query.eq('is_available', false);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(v => ({
          ...v,
          category_name: v.rental_vehicle_categories?.name || 'Non catégorisé',
          partner_name: v.partenaires?.company_name || 'Inconnu',
          city: v.partenaires?.city || 'Inconnue'
        })) as RentalVehicle[];
      }
    });
  };

  const useVehicleStats = () => {
    return useQuery({
      queryKey: ['rentalVehicleStats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('rental_vehicles')
          .select('id, moderation_status, is_available, is_active');
        
        if (error) throw error;
        
        const vehicles = data || [];
        return {
          total: vehicles.length,
          approved: vehicles.filter(v => v.moderation_status === 'approved').length,
          pending: vehicles.filter(v => v.moderation_status === 'pending').length,
          rejected: vehicles.filter(v => v.moderation_status === 'rejected').length,
          available: vehicles.filter(v => v.is_available && v.is_active).length
        };
      }
    });
  };

  const approveVehicle = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('rental_vehicles')
        .update({ moderation_status: 'approved', is_active: true })
        .eq('id', vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['rentalVehicleStats'] });
      toast({ title: 'Véhicule approuvé', description: 'Le véhicule est maintenant visible' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'approuver le véhicule', variant: 'destructive' });
    }
  });

  const rejectVehicle = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: string; reason: string }) => {
      const { error } = await supabase
        .from('rental_vehicles')
        .update({ moderation_status: 'rejected', rejection_reason: reason, is_active: false })
        .eq('id', vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['rentalVehicleStats'] });
      toast({ title: 'Véhicule rejeté', description: 'Le partenaire sera notifié' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de rejeter le véhicule', variant: 'destructive' });
    }
  });

  const toggleVehicleAvailability = useMutation({
    mutationFn: async ({ vehicleId, available }: { vehicleId: string; available: boolean }) => {
      const { error } = await supabase
        .from('rental_vehicles')
        .update({ is_available: available })
        .eq('id', vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalVehicles'] });
      toast({ title: 'Disponibilité mise à jour' });
    }
  });

  // ============ BOOKINGS ============

  const useBookings = (filters: RentalBookingFilters = {}) => {
    return useQuery({
      queryKey: ['rentalBookings', filters],
      queryFn: async () => {
        let query = supabase
          .from('rental_bookings')
          .select(`
            *,
            rental_vehicles!left(name, brand, model)
          `)
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.paymentStatus && filters.paymentStatus !== 'all') {
          query = query.eq('payment_status', filters.paymentStatus);
        }
        if (filters.startDate) {
          query = query.gte('start_date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('end_date', filters.endDate);
        }
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(b => ({
          ...b,
          vehicle_name: (b.rental_vehicles as any)?.name || 'N/A',
          vehicle_brand: (b.rental_vehicles as any)?.brand,
          vehicle_model: (b.rental_vehicles as any)?.model,
          client_name: 'Client',
          client_phone: null
        })) as RentalBooking[];
      }
    });
  };

  const useBookingStats = () => {
    return useQuery({
      queryKey: ['rentalBookingStats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select('id, status, payment_status, total_amount');
        
        if (error) throw error;
        
        const bookings = data || [];
        return {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          approved: bookings.filter(b => b.status === 'approved_by_partner').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
          totalRevenue: bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
          paidCount: bookings.filter(b => b.payment_status === 'paid').length
        };
      }
    });
  };

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('rental_bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalBookings'] });
      queryClient.invalidateQueries({ queryKey: ['rentalBookingStats'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    }
  });

  // ============ PARTNERS ============

  const usePartners = (filters: RentalPartnerFilters = {}) => {
    return useQuery({
      queryKey: ['rentalPartners', filters],
      queryFn: async () => {
        let query = supabase
          .from('partenaires')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.verificationStatus && filters.verificationStatus !== 'all') {
          query = query.eq('verification_status', filters.verificationStatus);
        }
        if (filters.city) {
          query = query.eq('city', filters.city);
        }
        if (filters.activeOnly) {
          query = query.eq('is_active', true);
        }
        if (filters.search) {
          query = query.or(`company_name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data: partners, error } = await query;
        if (error) throw error;

        // Fetch vehicle counts per partner
        const partnerIds = (partners || []).map(p => p.id);
        
        const { data: vehicleCounts } = await supabase
          .from('rental_vehicles')
          .select('partner_id')
          .in('partner_id', partnerIds);

        const { data: bookings } = await supabase
          .from('rental_bookings')
          .select('vehicle_id, total_amount, rental_vehicles!inner(partner_id)')
          .eq('status', 'completed');

        const vehicleCountMap: Record<string, number> = {};
        (vehicleCounts || []).forEach(v => {
          vehicleCountMap[v.partner_id] = (vehicleCountMap[v.partner_id] || 0) + 1;
        });

        const partnerRevenueMap: Record<string, { count: number; revenue: number }> = {};
        (bookings || []).forEach((b: any) => {
          const pid = b.rental_vehicles?.partner_id;
          if (pid) {
            if (!partnerRevenueMap[pid]) {
              partnerRevenueMap[pid] = { count: 0, revenue: 0 };
            }
            partnerRevenueMap[pid].count++;
            partnerRevenueMap[pid].revenue += Number(b.total_amount) || 0;
          }
        });

        return (partners || []).map(p => ({
          ...p,
          vehicles_count: vehicleCountMap[p.id] || 0,
          bookings_count: partnerRevenueMap[p.id]?.count || 0,
          total_revenue: partnerRevenueMap[p.id]?.revenue || 0
        })) as RentalPartner[];
      }
    });
  };

  const usePartnerStats = () => {
    return useQuery({
      queryKey: ['rentalPartnerStats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('partenaires')
          .select('id, verification_status, is_active');
        
        if (error) throw error;
        
        const partners = data || [];
        return {
          total: partners.length,
          verified: partners.filter(p => p.verification_status === 'verified').length,
          pending: partners.filter(p => p.verification_status === 'pending').length,
          active: partners.filter(p => p.is_active).length
        };
      }
    });
  };

  const togglePartnerActive = useMutation({
    mutationFn: async ({ partnerId, active }: { partnerId: string; active: boolean }) => {
      const { error } = await supabase
        .from('partenaires')
        .update({ is_active: active })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalPartners'] });
      queryClient.invalidateQueries({ queryKey: ['rentalPartnerStats'] });
      toast({ title: 'Statut partenaire mis à jour' });
    }
  });

  const verifyPartner = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('partenaires')
        .update({ verification_status: 'verified' })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalPartners'] });
      queryClient.invalidateQueries({ queryKey: ['rentalPartnerStats'] });
      toast({ title: 'Partenaire vérifié' });
    }
  });

  // ============ CATEGORIES ============

  const useCategories = () => {
    return useQuery({
      queryKey: ['rentalCategories'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('rental_vehicle_categories')
          .select('id, name')
          .order('name');
        if (error) throw error;
        return data || [];
      }
    });
  };

  // ============ CITIES ============

  const useCities = () => {
    return useQuery({
      queryKey: ['rentalCities'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('partenaires')
          .select('city')
          .not('city', 'is', null);
        if (error) throw error;
        const uniqueCities = [...new Set((data || []).map(p => p.city).filter(Boolean))];
        return uniqueCities.sort();
      }
    });
  };

  return {
    // Vehicles
    useVehicles,
    useVehicleStats,
    approveVehicle,
    rejectVehicle,
    toggleVehicleAvailability,
    // Bookings
    useBookings,
    useBookingStats,
    updateBookingStatus,
    // Partners
    usePartners,
    usePartnerStats,
    togglePartnerActive,
    verifyPartner,
    // Utils
    useCategories,
    useCities
  };
};
