/**
 * Hook unifié pour charger toutes les livraisons d'un chauffeur
 * Agrège: delivery_orders + marketplace_delivery_assignments + food_delivery_assignments
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UnifiedDelivery {
  id: string;
  source: 'delivery' | 'marketplace' | 'food';
  sourceId: string; // ID original dans la table source
  status: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  deliveryCoordinates: { lat: number; lng: number } | null;
  estimatedPrice: number;
  deliveryFee: number;
  clientId: string;
  clientName: string;
  clientPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  createdAt: string;
  deliveryType: string;
  // Metadata spécifique
  orderDetails?: {
    productTitle?: string;
    restaurantName?: string;
    quantity?: number;
    totalAmount?: number;
  };
}

interface UseDriverAllDeliveriesResult {
  deliveries: UnifiedDelivery[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDeliveryStatus: (id: string, source: string, newStatus: string) => Promise<boolean>;
}

const ACTIVE_STATUSES = ['confirmed', 'driver_assigned', 'picked_up', 'in_transit', 'assigned_to_driver', 'picked_up_by_driver'];

export const useDriverAllDeliveries = (): UseDriverAllDeliveriesResult => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<UnifiedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeDeliveryOrder = (order: any): UnifiedDelivery => ({
    id: `delivery-${order.id}`,
    source: 'delivery',
    sourceId: order.id,
    status: order.status,
    pickupLocation: order.pickup_location || '',
    deliveryLocation: order.delivery_location || '',
    pickupCoordinates: order.pickup_coordinates,
    deliveryCoordinates: order.delivery_coordinates,
    estimatedPrice: order.estimated_price || 0,
    deliveryFee: order.estimated_price || 0,
    clientId: order.user_id,
    clientName: order.sender_name || 'Client',
    clientPhone: order.sender_phone || '',
    recipientName: order.recipient_name,
    recipientPhone: order.recipient_phone,
    createdAt: order.created_at,
    deliveryType: order.delivery_type || 'standard',
    orderDetails: {
      productTitle: `Colis ${order.package_type || 'standard'}`,
      quantity: 1,
      totalAmount: order.estimated_price
    }
  });

  const normalizeMarketplaceAssignment = (assignment: any): UnifiedDelivery => {
    const order = assignment.marketplace_orders;
    return {
      id: `marketplace-${assignment.id}`,
      source: 'marketplace',
      sourceId: assignment.id,
      status: assignment.assignment_status || 'pending',
      pickupLocation: order?.pickup_address || order?.seller?.address || 'Boutique vendeur',
      deliveryLocation: order?.delivery_address || '',
      pickupCoordinates: order?.pickup_coordinates,
      deliveryCoordinates: order?.delivery_coordinates,
      estimatedPrice: order?.total_amount || 0,
      deliveryFee: order?.delivery_fee || 0,
      clientId: order?.buyer_id,
      clientName: order?.buyer?.display_name || 'Client',
      clientPhone: order?.buyer_phone || order?.buyer?.phone_number || '',
      recipientName: order?.buyer?.display_name,
      recipientPhone: order?.buyer_phone,
      createdAt: assignment.created_at,
      deliveryType: 'marketplace',
      orderDetails: {
        productTitle: order?.product?.title || 'Produit marketplace',
        quantity: order?.quantity || 1,
        totalAmount: order?.total_amount
      }
    };
  };

  const normalizeFoodOrder = (order: any): UnifiedDelivery => ({
    id: `food-${order.id}`,
    source: 'food',
    sourceId: order.id,
    status: order.status || 'pending',
    pickupLocation: order.restaurant?.address || order.restaurant?.restaurant_name || 'Restaurant',
    deliveryLocation: order.delivery_address || '',
    pickupCoordinates: order.restaurant?.coordinates,
    deliveryCoordinates: order.delivery_coordinates,
    estimatedPrice: order.total_amount || 0,
    deliveryFee: order.delivery_fee || 0,
    clientId: order.customer_id,
    clientName: order.customer?.display_name || 'Client',
    clientPhone: order.delivery_phone || order.customer?.phone_number || '',
    recipientName: order.customer?.display_name,
    recipientPhone: order.delivery_phone,
    createdAt: order.created_at,
    deliveryType: 'food',
    orderDetails: {
      restaurantName: order.restaurant?.restaurant_name,
      quantity: order.items?.length || 1,
      totalAmount: order.total_amount
    }
  });

  const loadAllDeliveries = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Charger les 3 sources en parallèle
      const [deliveryResult, marketplaceResult, foodResult] = await Promise.all([
        // 1. delivery_orders (livraisons standalone)
        supabase
          .from('delivery_orders')
          .select(`
            id, status, pickup_location, delivery_location,
            pickup_coordinates, delivery_coordinates, delivery_type,
            estimated_price, user_id, created_at, package_type,
            sender_name, sender_phone, recipient_name, recipient_phone
          `)
          .eq('driver_id', user.id)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false }),

        // 2. marketplace_delivery_assignments
        supabase
          .from('marketplace_delivery_assignments')
          .select(`
            id, assignment_status, created_at,
            marketplace_orders!inner(
              id, total_amount, delivery_fee, quantity,
              pickup_address, delivery_address, buyer_phone,
              pickup_coordinates, delivery_coordinates,
              buyer_id,
              product:marketplace_products(title),
              buyer:profiles(display_name, phone_number),
              seller:vendor_profiles(shop_name, address)
            )
          `)
          .eq('driver_id', user.id)
          .not('assignment_status', 'in', '("completed","cancelled")')
          .order('created_at', { ascending: false }),

        // 3. food_orders (livraisons food directement attribuées au driver)
        supabase
          .from('food_orders')
          .select(`
            id, status, total_amount, delivery_fee, delivery_address, delivery_phone,
            delivery_coordinates, customer_id, items, created_at,
            customer:profiles(display_name, phone_number),
            restaurant:restaurant_profiles(restaurant_name, address, coordinates)
          `)
          .eq('driver_id', user.id)
          .not('status', 'in', '("completed","cancelled","delivered")')
          .order('created_at', { ascending: false })
      ]);

      // Traiter les résultats
      const allDeliveries: UnifiedDelivery[] = [];

      if (deliveryResult.data) {
        allDeliveries.push(...deliveryResult.data.map(normalizeDeliveryOrder));
      }
      if (deliveryResult.error) {
        console.warn('Error loading delivery_orders:', deliveryResult.error);
      }

      if (marketplaceResult.data) {
        allDeliveries.push(...marketplaceResult.data.map(normalizeMarketplaceAssignment));
      }
      if (marketplaceResult.error) {
        console.warn('Error loading marketplace assignments:', marketplaceResult.error);
      }

      if (foodResult.data) {
        allDeliveries.push(...foodResult.data.map(normalizeFoodOrder));
      }
      if (foodResult.error) {
        console.warn('Error loading food orders:', foodResult.error);
      }

      // Trier par date (plus récent en premier)
      allDeliveries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setDeliveries(allDeliveries);
      console.log(`Loaded ${allDeliveries.length} unified deliveries for driver`);

    } catch (err) {
      console.error('Error loading all deliveries:', err);
      setError('Erreur de chargement des livraisons');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateDeliveryStatus = useCallback(async (
    id: string,
    source: string,
    newStatus: string
  ): Promise<boolean> => {
    try {
      const sourceId = id.replace(`${source}-`, '');

      switch (source) {
        case 'delivery':
          const { error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({ 
              status: newStatus, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', sourceId);
          if (deliveryError) throw deliveryError;
          break;

        case 'marketplace':
          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({ 
              assignment_status: newStatus, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', sourceId);
          if (marketplaceError) throw marketplaceError;
          break;

        case 'food':
          const { error: foodError } = await supabase
            .from('food_orders')
            .update({ 
              status: newStatus, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', sourceId);
          if (foodError) throw foodError;
          break;
      }

      await loadAllDeliveries();
      return true;
    } catch (err) {
      console.error('Error updating delivery status:', err);
      return false;
    }
  }, [loadAllDeliveries]);

  useEffect(() => {
    if (user?.id) {
      loadAllDeliveries();
    }
  }, [user?.id, loadAllDeliveries]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id && !document.hidden) {
        loadAllDeliveries();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, loadAllDeliveries]);

  return {
    deliveries,
    loading,
    error,
    refresh: loadAllDeliveries,
    updateDeliveryStatus
  };
};

export default useDriverAllDeliveries;
