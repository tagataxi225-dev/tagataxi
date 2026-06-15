import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type BookingStatus = 'all' | 'pending' | 'confirmed' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface BookingProfile {
  id: string;
  user_id: string;
  pickup_location: string;
  destination: string;
  pickup_coordinates: { lat: number; lng: number } | null;
  destination_coordinates: { lat: number; lng: number } | null;
  vehicle_type: string;
  estimated_price: number;
  actual_price: number | null;
  status: string;
  driver_id: string | null;
  created_at: string;
  pickup_time: string | null;
  completion_time: string | null;
  total_distance: number | null;
  customer_name?: string;
  customer_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  city?: string;
  payment_method?: string;
  payment_status?: string;
}

export interface BookingFilters {
  search: string;
  status: BookingStatus;
  vehicleType: string;
  city: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

interface UseBookingManagementReturn {
  bookings: BookingProfile[];
  stats: BookingStats;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: BookingFilters;
  setFilters: (filters: Partial<BookingFilters>) => void;
  setCurrentPage: (page: number) => void;
  refreshData: () => Promise<void>;
  exportBookings: () => Promise<void>;
  cancelBooking: (bookingId: string, reason: string) => Promise<void>;
  assignDriver: (bookingId: string, driverId: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export const useBookingManagement = (): UseBookingManagementReturn => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingProfile[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<BookingFilters>({
    search: '',
    status: 'all',
    vehicleType: 'all',
    city: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch bookings with pagination and filters
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transport_bookings')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`pickup_location.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.vehicleType !== 'all') {
        query = query.eq('vehicle_type', filters.vehicleType);
      }

      if (filters.city !== 'all') {
        query = query.eq('city', filters.city);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: bookingsData, error: bookingsError, count } = await query;

      if (bookingsError) throw bookingsError;

      // Get client data for customer names
      const userIds = [...new Set(bookingsData?.map(b => b.user_id).filter(Boolean) || [])];
      const driverIds = [...new Set(bookingsData?.map(b => b.driver_id).filter(Boolean) || [])];

      let clientsMap: Record<string, any> = {};
      let driversMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('user_id, display_name, phone_number')
          .in('user_id', userIds);
        
        clientsMap = (clientsData || []).reduce((acc, c) => {
          acc[c.user_id] = c;
          return acc;
        }, {} as Record<string, any>);
      }

      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('chauffeurs')
          .select('user_id, display_name, phone_number')
          .in('user_id', driverIds);
        
        driversMap = (driversData || []).reduce((acc, d) => {
          acc[d.user_id] = d;
          return acc;
        }, {} as Record<string, any>);
      }

      // Transform data
      const transformedBookings: BookingProfile[] = (bookingsData || []).map((booking: any) => {
        const client = clientsMap[booking.user_id];
        const driver = driversMap[booking.driver_id];

        return {
          id: booking.id,
          user_id: booking.user_id,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          pickup_coordinates: booking.pickup_coordinates,
          destination_coordinates: booking.destination_coordinates,
          vehicle_type: booking.vehicle_type,
          estimated_price: booking.estimated_price || 0,
          actual_price: booking.actual_price,
          status: booking.status,
          driver_id: booking.driver_id,
          created_at: booking.created_at,
          pickup_time: booking.pickup_time,
          completion_time: booking.completion_time,
          total_distance: booking.total_distance,
          customer_name: client?.display_name || 'Client anonyme',
          customer_phone: client?.phone_number,
          driver_name: driver?.display_name || null,
          driver_phone: driver?.phone_number,
          city: booking.city,
          payment_method: booking.payment_method,
          payment_status: booking.payment_status,
        };
      });

      setBookings(transformedBookings);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Erreur lors du chargement des courses');
      toast({
        title: "Erreur",
        description: "Impossible de charger les courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  // Fetch booking statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data: allBookings, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('id, status, actual_price, estimated_price');

      if (bookingsError) throw bookingsError;

      const totalBookings = allBookings?.length || 0;
      const pendingBookings = allBookings?.filter(b => b.status === 'pending').length || 0;
      const activeBookings = allBookings?.filter(b => 
        ['confirmed', 'driver_assigned', 'in_progress'].includes(b.status)
      ).length || 0;
      const completedBookings = allBookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = allBookings?.filter(b => b.status === 'cancelled').length || 0;
      const totalRevenue = allBookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

      setStats({
        totalBookings,
        pendingBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
      });
    } catch (err) {
      console.error('Error fetching booking stats:', err);
    }
  }, []);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<BookingFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchStats()]);
  }, [fetchBookings, fetchStats]);

  // Export bookings
  const exportBookings = useCallback(async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Génération du fichier d'export des courses...",
      });

      // Generate CSV
      const headers = ['ID', 'Client', 'Départ', 'Destination', 'Type véhicule', 'Chauffeur', 'Prix', 'Statut', 'Date'];
      const csvData = bookings.map(b => [
        b.id.substring(0, 8),
        b.customer_name,
        b.pickup_location,
        b.destination,
        b.vehicle_type,
        b.driver_name || 'Non assigné',
        b.actual_price || b.estimated_price,
        b.status,
        new Date(b.created_at).toLocaleDateString('fr-FR'),
      ]);

      const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast({
        title: "Export terminé",
        description: "Le fichier des courses a été téléchargé avec succès",
      });
    } catch (err) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données des courses",
        variant: "destructive",
      });
    }
  }, [bookings, toast]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId: string, reason: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Course annulée",
        description: "La course a été annulée avec succès",
      });

      await refreshData();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshData]);

  // Assign driver
  const assignDriver = useCallback(async (bookingId: string, driverId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          driver_id: driverId,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Chauffeur assigné",
        description: "Le chauffeur a été assigné avec succès",
      });

      await refreshData();
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le chauffeur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshData]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    bookings,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportBookings,
    cancelBooking,
    assignDriver,
  };
};
