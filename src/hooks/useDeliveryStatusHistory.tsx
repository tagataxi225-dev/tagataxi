import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StatusHistoryEntry {
  id: string;
  delivery_order_id: string;
  status: string;
  previous_status?: string;
  changed_at: string;
  changed_by?: string;
  location_coordinates?: any;
  notes?: string;
  metadata?: any;
}

export const useDeliveryStatusHistory = (deliveryOrderId: string) => {
  const [loading, setLoading] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);

  // Load status history for a delivery order
  const loadStatusHistory = async () => {
    if (!deliveryOrderId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_status_history')
        .select('*')
        .eq('delivery_order_id', deliveryOrderId)
        .order('changed_at', { ascending: true });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error: any) {
      console.error('Error loading status history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  // Get formatted status labels
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      driver_assigned: 'Chauffeur assigné',
      picked_up: 'Colis récupéré',
      in_transit: 'En cours de livraison',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return statusLabels[status] || status;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      pending: 'text-orange-600',
      confirmed: 'text-blue-600',
      driver_assigned: 'text-purple-600',
      picked_up: 'text-yellow-600',
      in_transit: 'text-indigo-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return statusColors[status] || 'text-gray-600';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Get current status (latest entry)
  const getCurrentStatus = (): StatusHistoryEntry | null => {
    return statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null;
  };

  // Check if status is terminal (delivery complete or cancelled)
  const isTerminalStatus = (status: string): boolean => {
    return ['delivered', 'cancelled'].includes(status);
  };

  // Get progress percentage based on current status
  const getProgressPercentage = (status: string): number => {
    const progressMap: Record<string, number> = {
      pending: 10,
      confirmed: 25,
      driver_assigned: 40,
      picked_up: 60,
      in_transit: 80,
      delivered: 100,
      cancelled: 0
    };
    return progressMap[status] || 0;
  };

  useEffect(() => {
    loadStatusHistory();
  }, [deliveryOrderId]);

  // Real-time subscription to status changes
  useEffect(() => {
    if (!deliveryOrderId) return;

    const channel = supabase
      .channel(`delivery-status-${deliveryOrderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_status_history',
        filter: `delivery_order_id=eq.${deliveryOrderId}`
      }, (payload) => {
        setStatusHistory(prev => [...prev, payload.new as StatusHistoryEntry]);
        
        // Show notification for status change
        const newEntry = payload.new as StatusHistoryEntry;
        if (newEntry.notes) {
          toast.info(newEntry.notes);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryOrderId]);

  return {
    loading,
    statusHistory,
    loadStatusHistory,
    getStatusLabel,
    getStatusColor,
    formatDate,
    getCurrentStatus,
    isTerminalStatus,
    getProgressPercentage
  };
};