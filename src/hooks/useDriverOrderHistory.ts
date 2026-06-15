import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseDriverOrderHistoryOptions {
  serviceType?: 'transport' | 'delivery';
  period?: 'today' | 'week' | 'month' | 'all';
}

export const useDriverOrderHistory = (options: UseDriverOrderHistoryOptions = {}) => {
  const { user } = useAuth();
  const { serviceType, period = 'month' } = options;

  return useQuery({
    queryKey: ['driver-order-history', user?.id, serviceType, period],
    queryFn: async () => {
      if (!user?.id) return [];

      // Calculer la date de début selon la période
      const getStartDate = () => {
        const now = new Date();
        switch (period) {
          case 'today':
            now.setHours(0, 0, 0, 0);
            return now;
          case 'week':
            now.setDate(now.getDate() - 7);
            return now;
          case 'month':
            now.setMonth(now.getMonth() - 1);
            return now;
          default:
            return null;
        }
      };

      const startDate = getStartDate();
      const orders: any[] = [];

      // Récupérer les courses VTC
      if (!serviceType || serviceType === 'transport') {
        let query = supabase
          .from('transport_bookings')
          .select('id, status, pickup_location, actual_price, created_at')
          .eq('driver_id', user.id)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false });

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: transportOrders } = await query;

        if (transportOrders) {
          orders.push(...transportOrders.map(order => ({
            ...order,
            service_type: 'transport' as const,
            destination_location: 'Destination VTC',
          })));
        }
      }

      // Récupérer les livraisons
      if (!serviceType || serviceType === 'delivery') {
        let query = supabase
          .from('delivery_orders')
          .select('id, status, pickup_location, delivery_location, actual_price, created_at, picked_up_at, delivered_at')
          .eq('driver_id', user.id)
          .in('status', ['delivered', 'cancelled'])
          .order('created_at', { ascending: false });

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: deliveryOrders } = await query;

        if (deliveryOrders) {
          orders.push(...deliveryOrders.map(order => {
            const duration = order.picked_up_at && order.delivered_at
              ? Math.round((new Date(order.delivered_at).getTime() - new Date(order.picked_up_at).getTime()) / 60000)
              : undefined;

            return {
              ...order,
              service_type: 'delivery' as const,
              destination_location: order.delivery_location,
              duration_minutes: duration,
            };
          }));
        }
      }

      // Trier par date décroissante
      return orders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.id,
  });
};
