import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type DeliveryStatus = 'all' | 'pending' | 'confirmed' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type DeliveryType = 'all' | 'flash' | 'flex' | 'maxicharge';

export interface DeliveryProfile {
  id: string;
  user_id: string;
  pickup_location: string;
  delivery_location: string;
  pickup_google_address?: string;
  delivery_google_address?: string;
  delivery_type: string;
  package_type?: string;
  package_weight?: number;
  estimated_price: number;
  actual_price?: number;
  status: string;
  driver_id?: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  created_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  city?: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface DeliveryFilters {
  search: string;
  status: DeliveryStatus;
  deliveryType: DeliveryType;
  city: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  activeDeliveries: number;
  deliveredDeliveries: number;
  cancelledDeliveries: number;
  totalRevenue: number;
  avgDeliveryTime: number;
}

interface UseDeliveryManagementReturn {
  deliveries: DeliveryProfile[];
  stats: DeliveryStats;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: DeliveryFilters;
  setFilters: (filters: Partial<DeliveryFilters>) => void;
  setCurrentPage: (page: number) => void;
  refreshData: () => Promise<void>;
  exportDeliveries: () => Promise<void>;
  cancelDelivery: (deliveryId: string, reason: string) => Promise<void>;
  assignDriver: (deliveryId: string, driverId: string) => Promise<void>;
  markDelivered: (deliveryId: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export const useDeliveryManagement = (): UseDeliveryManagementReturn => {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryProfile[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    activeDeliveries: 0,
    deliveredDeliveries: 0,
    cancelledDeliveries: 0,
    totalRevenue: 0,
    avgDeliveryTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<DeliveryFilters>({
    search: '',
    status: 'all',
    deliveryType: 'all',
    city: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('delivery_orders')
        .select('*', { count: 'exact' });

      if (filters.search) {
        query = query.or(`pickup_location.ilike.%${filters.search}%,delivery_location.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%,sender_name.ilike.%${filters.search}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.deliveryType !== 'all') {
        query = query.eq('delivery_type', filters.deliveryType);
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

      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: deliveriesData, error: deliveriesError, count } = await query;

      if (deliveriesError) throw deliveriesError;

      const driverIds = [...new Set(deliveriesData?.map(d => d.driver_id).filter(Boolean) || [])];
      let driversMap: Record<string, any> = {};

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

      const transformedDeliveries: DeliveryProfile[] = (deliveriesData || []).map((delivery: any) => {
        const driver = driversMap[delivery.driver_id];

        return {
          id: delivery.id,
          user_id: delivery.user_id,
          pickup_location: delivery.pickup_location,
          delivery_location: delivery.delivery_location,
          pickup_google_address: delivery.pickup_google_address,
          delivery_google_address: delivery.delivery_google_address,
          delivery_type: delivery.delivery_type,
          package_type: delivery.package_type,
          package_weight: delivery.package_weight,
          estimated_price: delivery.estimated_price || 0,
          actual_price: delivery.actual_price,
          status: delivery.status,
          driver_id: delivery.driver_id,
          sender_name: delivery.sender_name,
          sender_phone: delivery.sender_phone,
          recipient_name: delivery.recipient_name,
          recipient_phone: delivery.recipient_phone,
          created_at: delivery.created_at,
          picked_up_at: delivery.picked_up_at,
          delivered_at: delivery.delivered_at,
          city: delivery.city,
          driver_name: driver?.display_name || null,
          driver_phone: driver?.phone_number,
        };
      });

      setDeliveries(transformedDeliveries);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Erreur lors du chargement des livraisons');
      toast({
        title: "Erreur",
        description: "Impossible de charger les livraisons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const { data: allDeliveries, error: deliveriesError } = await supabase
        .from('delivery_orders')
        .select('id, status, actual_price, estimated_price, created_at, delivered_at');

      if (deliveriesError) throw deliveriesError;

      const totalDeliveries = allDeliveries?.length || 0;
      const pendingDeliveries = allDeliveries?.filter(d => d.status === 'pending').length || 0;
      const activeDeliveries = allDeliveries?.filter(d => 
        ['confirmed', 'driver_assigned', 'picked_up', 'in_transit'].includes(d.status)
      ).length || 0;
      const deliveredDeliveries = allDeliveries?.filter(d => d.status === 'delivered').length || 0;
      const cancelledDeliveries = allDeliveries?.filter(d => d.status === 'cancelled').length || 0;
      const totalRevenue = allDeliveries
        ?.filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + (d.actual_price || d.estimated_price || 0), 0) || 0;

      // Calculate average delivery time
      const completedWithTimes = allDeliveries?.filter(d => 
        d.status === 'delivered' && d.created_at && d.delivered_at
      ) || [];
      
      let avgDeliveryTime = 0;
      if (completedWithTimes.length > 0) {
        const totalTime = completedWithTimes.reduce((sum, d) => {
          const start = new Date(d.created_at).getTime();
          const end = new Date(d.delivered_at!).getTime();
          return sum + (end - start);
        }, 0);
        avgDeliveryTime = Math.round(totalTime / completedWithTimes.length / 60000); // in minutes
      }

      setStats({
        totalDeliveries,
        pendingDeliveries,
        activeDeliveries,
        deliveredDeliveries,
        cancelledDeliveries,
        totalRevenue,
        avgDeliveryTime,
      });
    } catch (err) {
      console.error('Error fetching delivery stats:', err);
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<DeliveryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchDeliveries(), fetchStats()]);
  }, [fetchDeliveries, fetchStats]);

  const exportDeliveries = useCallback(async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Génération du fichier d'export des livraisons...",
      });

      const headers = ['ID', 'Expéditeur', 'Destinataire', 'Départ', 'Arrivée', 'Type', 'Livreur', 'Prix', 'Statut', 'Date'];
      const csvData = deliveries.map(d => [
        d.id.substring(0, 8),
        d.sender_name,
        d.recipient_name,
        d.pickup_location,
        d.delivery_location,
        d.delivery_type,
        d.driver_name || 'Non assigné',
        d.actual_price || d.estimated_price,
        d.status,
        new Date(d.created_at).toLocaleDateString('fr-FR'),
      ]);

      const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livraisons_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast({
        title: "Export terminé",
        description: "Le fichier des livraisons a été téléchargé",
      });
    } catch (err) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  }, [deliveries, toast]);

  const cancelDelivery = useCallback(async (deliveryId: string, reason: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Livraison annulée",
        description: "La livraison a été annulée avec succès",
      });

      await refreshData();
    } catch (err) {
      console.error('Error cancelling delivery:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la livraison",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshData]);

  const assignDriver = useCallback(async (deliveryId: string, driverId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          driver_id: driverId,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès",
      });

      await refreshData();
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le livreur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshData]);

  const markDelivered = useCallback(async (deliveryId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Livraison complétée",
        description: "La livraison a été marquée comme livrée",
      });

      await refreshData();
    } catch (err) {
      console.error('Error marking delivered:', err);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme livré",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    deliveries,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportDeliveries,
    cancelDelivery,
    assignDriver,
    markDelivered,
  };
};
