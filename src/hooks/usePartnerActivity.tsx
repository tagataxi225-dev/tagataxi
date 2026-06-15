import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActivityItem {
  id: string;
  type: 'ride' | 'driver_added' | 'payment' | 'maintenance';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export const usePartnerActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get partner drivers
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select('driver_id, created_at, driver_code')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (driversError) {
        console.error('Error fetching partner drivers:', driversError);
        return;
      }

      const driverIds = partnerDrivers?.map(pd => pd.driver_id) || [];

      // Get recent transport bookings
      const { data: recentTransportBookings, error: transportError } = await supabase
        .from('transport_bookings')
        .select('id, status, created_at, pickup_location, destination')
        .in('driver_id', driverIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent delivery orders
      const { data: recentDeliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('id, status, created_at, pickup_location, delivery_location')
        .in('driver_id', driverIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transportError) console.error('Error fetching transport bookings:', transportError);
      if (deliveryError) console.error('Error fetching delivery orders:', deliveryError);

      // Convert to activity items
      const activityItems: ActivityItem[] = [];

      // Add driver additions
      partnerDrivers?.forEach(driver => {
        activityItems.push({
          id: `driver_${driver.driver_id}`,
          type: 'driver_added',
          title: 'Chauffeur ajouté',
          description: `Code: ${driver.driver_code}`,
          timestamp: driver.created_at,
          icon: 'UserPlus',
          color: 'bg-accent'
        });
      });

      // Add recent rides
      recentTransportBookings?.forEach(booking => {
        let title = 'Nouveau trajet';
        let color = 'bg-primary';
        
        if (booking.status === 'completed') {
          title = 'Trajet terminé';
          color = 'bg-green-500';
        } else if (booking.status === 'in_progress') {
          title = 'Trajet en cours';
          color = 'bg-blue-500';
        }

        activityItems.push({
          id: `transport_${booking.id}`,
          type: 'ride',
          title,
          description: `${booking.pickup_location} → ${booking.destination}`,
          timestamp: booking.created_at,
          icon: 'Car',
          color
        });
      });

      // Add recent deliveries
      recentDeliveryOrders?.forEach(order => {
        let title = 'Nouvelle livraison';
        let color = 'bg-secondary';
        
        if (order.status === 'completed') {
          title = 'Livraison terminée';
          color = 'bg-green-500';
        } else if (order.status === 'in_progress') {
          title = 'Livraison en cours';
          color = 'bg-orange-500';
        }

        activityItems.push({
          id: `delivery_${order.id}`,
          type: 'ride',
          title,
          description: `${order.pickup_location} → ${order.delivery_location}`,
          timestamp: order.created_at,
          icon: 'Package',
          color
        });
      });

      // Sort by timestamp and take the most recent
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Add sample payment activity
      if (activityItems.length > 0) {
        activityItems.splice(2, 0, {
          id: 'payment_sample',
          type: 'payment',
          title: 'Paiement reçu',
          description: 'Commission courses',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          icon: 'CreditCard',
          color: 'bg-green-500'
        });
      }

      setActivities(activityItems.slice(0, 10));

    } catch (error) {
      console.error('Error fetching partner activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
      
      // Refresh every 2 minutes
      const interval = setInterval(fetchRecentActivity, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    activities,
    loading,
    refreshActivity: fetchRecentActivity
  };
};