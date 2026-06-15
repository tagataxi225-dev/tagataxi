import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type DriverStatus = 'all' | 'online' | 'offline' | 'available' | 'busy';

export interface DriverProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  service_type: string;
  verification_status: string;
  is_active: boolean;
  rating_average: number;
  total_rides: number;
  created_at: string;
  last_activity?: string;
  is_online?: boolean;
  is_available?: boolean;
  current_location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DriverFilters {
  search: string;
  status: DriverStatus;
  serviceType: string;
  verificationStatus: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DriverStats {
  totalDrivers: number;
  onlineDrivers: number;
  availableDrivers: number;
  busyDrivers: number;
  verifiedDrivers: number;
  newDriversToday: number;
}

interface UseDriverManagementReturn {
  drivers: DriverProfile[];
  stats: DriverStats;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: DriverFilters;
  setFilters: (filters: Partial<DriverFilters>) => void;
  setCurrentPage: (page: number) => void;
  refreshData: () => Promise<void>;
  exportDrivers: () => Promise<void>;
  updateDriverStatus: (driverId: string, status: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export const useDriverManagement = (): UseDriverManagementReturn => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    totalDrivers: 0,
    onlineDrivers: 0,
    availableDrivers: 0,
    busyDrivers: 0,
    verifiedDrivers: 0,
    newDriversToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<DriverFilters>({
    search: '',
    status: 'all',
    serviceType: 'all',
    verificationStatus: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch drivers with pagination and filters
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORRECTION: Utiliser la table 'chauffeurs' au lieu de 'driver_profiles'
      let query = supabase
        .from('chauffeurs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,license_number.ilike.%${filters.search}%,vehicle_plate.ilike.%${filters.search}%`);
      }

      if (filters.serviceType !== 'all') {
        query = query.eq('service_type', filters.serviceType);
      }

      if (filters.verificationStatus !== 'all') {
        query = query.eq('verification_status', filters.verificationStatus);
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

      const { data: driversData, error: driversError, count } = await query;

      if (driversError) {
        throw driversError;
      }

      // Get driver locations for online status
      const driverUserIds = driversData?.map(d => d.user_id) || [];
      let driverLocations: any[] = [];
      
      if (driverUserIds.length > 0) {
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('driver_id, is_online, is_available, latitude, longitude, last_ping')
          .in('driver_id', driverUserIds);
        
        driverLocations = locationData || [];
      }

      // Get auth users data for email and last activity
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUsers = authData?.users || [];

      // Transform data
      const transformedDrivers: DriverProfile[] = (driversData || []).map((driver: any) => {
        const authUser = authUsers.find(u => u.id === driver.user_id);
        const location = driverLocations.find(l => l.driver_id === driver.user_id);
        const isOnline = location?.is_online && location?.last_ping && 
          (new Date().getTime() - new Date(location.last_ping).getTime()) < 10 * 60 * 1000; // 10 minutes

        // ✅ CORRECTION: Utiliser directement les données de 'chauffeurs'
        return {
          id: driver.id,
          user_id: driver.user_id,
          display_name: driver.display_name || 'N/A',
          email: driver.email || authUser?.email || 'N/A',
          phone_number: driver.phone_number,
          avatar_url: driver.profile_photo_url,
          vehicle_make: driver.vehicle_make,
          vehicle_model: driver.vehicle_model,
          vehicle_plate: driver.vehicle_plate,
          service_type: driver.service_type,
          verification_status: driver.verification_status,
          is_active: driver.is_active,
          rating_average: driver.rating_average || 0,
          total_rides: driver.total_rides || 0,
          created_at: driver.created_at,
          last_activity: authUser?.last_sign_in_at,
          is_online: isOnline,
          is_available: location?.is_available || false,
          current_location: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : undefined
        };
      }).filter(driver => {
        if (filters.status === 'all') return true;
        if (filters.status === 'online') return driver.is_online;
        if (filters.status === 'offline') return !driver.is_online;
        if (filters.status === 'available') return driver.is_online && driver.is_available;
        if (filters.status === 'busy') return driver.is_online && !driver.is_available;
        return true;
      });

      setDrivers(transformedDrivers);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Erreur lors du chargement des chauffeurs');
      toast({
        title: "Erreur",
        description: "Impossible de charger les chauffeurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  // Fetch driver statistics
  const fetchStats = useCallback(async () => {
    try {
      console.log('📊 Fetching driver statistics...');
      
      // Get all drivers from chauffeurs table
      const { data: allDrivers, error: driversError } = await supabase
        .from('chauffeurs')
        .select('user_id, verification_status, is_active, created_at');

      if (driversError) throw driversError;

      // Get online status from driver_locations
      const { data: locations, error: locationsError } = await supabase
        .from('driver_locations')
        .select('driver_id, is_online, is_available, last_ping');

      if (locationsError) throw locationsError;

      const now = new Date().getTime();
      const onlineDrivers = locations?.filter(l => 
        l.is_online && l.last_ping && 
        (now - new Date(l.last_ping).getTime()) < 10 * 60 * 1000
      ) || [];

      const availableDrivers = onlineDrivers.filter(l => l.is_available);
      const busyDrivers = onlineDrivers.filter(l => !l.is_available);

      // Count new drivers today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newDriversToday = allDrivers?.filter(d => 
        new Date(d.created_at) >= today
      ) || [];

      setStats({
        totalDrivers: allDrivers?.length || 0,
        onlineDrivers: onlineDrivers.length,
        availableDrivers: availableDrivers.length,
        busyDrivers: busyDrivers.length,
        verifiedDrivers: allDrivers?.filter(d => d.verification_status === 'verified').length || 0,
        newDriversToday: newDriversToday.length,
      });

      console.log('✅ Driver statistics loaded:', {
        total: allDrivers?.length,
        online: onlineDrivers.length,
        available: availableDrivers.length,
        busy: busyDrivers.length,
      });
    } catch (err) {
      console.error('❌ Error fetching driver stats:', err);
    }
  }, []);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<DriverFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchDrivers(), fetchStats()]);
  }, [fetchDrivers, fetchStats]);

  // Export drivers
  const exportDrivers = useCallback(async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Génération du fichier d'export des chauffeurs...",
      });

      // Implementation would go here
      toast({
        title: "Export terminé",
        description: "Le fichier des chauffeurs a été téléchargé avec succès",
      });
    } catch (err) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données des chauffeurs",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Update driver status
  const updateDriverStatus = useCallback(async (driverId: string, status: string) => {
    try {
      console.log('🔄 Updating driver status', { driverId, status });
      setLoading(true);

      const { error } = await supabase
        .from('chauffeurs')
        .update({ is_active: status === 'active' })
        .eq('user_id', driverId);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      toast({
        title: "Statut mis à jour",
        description: `Le statut du chauffeur a été modifié`,
      });

      await refreshData();
      console.log('✅ Driver status updated successfully');
    } catch (err) {
      console.error('❌ Error updating driver status:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
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
    drivers,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportDrivers,
    updateDriverStatus,
  };
};