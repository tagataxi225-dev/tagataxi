import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UnifiedDeliveryItem {
  id: string;
  type: 'marketplace' | 'direct';
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates?: { lat: number; lng: number };
  delivery_coordinates?: { lat: number; lng: number };
  estimated_fee: number;
  package_type?: string;
  loading_assistance?: boolean;
  vehicle_size?: string;
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  status: string;
  created_at: string;
  marketplace_order?: {
    product_title: string;
    seller_name: string;
    total_amount: number;
  };
}

export interface DeliveryCompletionData {
  recipientName?: string;
  notes?: string;
  photoUrl?: string;
}

export const useUnifiedDeliveryQueue = () => {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<UnifiedDeliveryItem[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<UnifiedDeliveryItem | null>(null);
  const { user } = useAuth();

  const loadAvailableDeliveries = async () => {
    if (!user) return;

    setLoading(true);
    try {
        // Load marketplace deliveries
      const { data: marketplaceDeliveries, error: marketplaceError } = await supabase
        .from('marketplace_delivery_assignments')
        .select(`
          *,
          marketplace_orders!inner(
            total_amount,
            buyer_id,
            marketplace_products!inner(title)
          )
        `)
        .eq('assignment_status', 'pending')
        .is('driver_id', null);

      if (marketplaceError) throw marketplaceError;

      // Load direct deliveries  
      const { data: directDeliveries, error: directError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null);

      if (directError) throw directError;

      // Format marketplace deliveries
      const formattedMarketplace: UnifiedDeliveryItem[] = marketplaceDeliveries?.map(delivery => ({
        id: delivery.id,
        type: 'marketplace' as const,
        pickup_location: delivery.pickup_location,
        delivery_location: delivery.delivery_location,
        pickup_coordinates: delivery.pickup_coordinates as { lat: number; lng: number } | undefined,
        delivery_coordinates: delivery.delivery_coordinates as { lat: number; lng: number } | undefined,
        estimated_fee: delivery.delivery_fee || 5000,
        customer_name: 'Client Marketplace',
        customer_phone: undefined,
        notes: delivery.driver_notes,
        status: delivery.assignment_status,
        created_at: delivery.created_at,
        marketplace_order: {
          product_title: delivery.marketplace_orders?.marketplace_products?.title || 'Produit',
          seller_name: 'Vendeur',
          total_amount: delivery.marketplace_orders?.total_amount || 0
        }
      })) || [];

      // Format direct deliveries
      const formattedDirect: UnifiedDeliveryItem[] = directDeliveries?.map(delivery => ({
        id: delivery.id,
        type: 'direct' as const,
        pickup_location: delivery.pickup_location,
        delivery_location: delivery.delivery_location,
        pickup_coordinates: delivery.pickup_coordinates as { lat: number; lng: number } | undefined,
        delivery_coordinates: delivery.delivery_coordinates as { lat: number; lng: number } | undefined,
        estimated_fee: delivery.estimated_price || 0,
        package_type: delivery.package_type,
        loading_assistance: delivery.loading_assistance,
        vehicle_size: delivery.vehicle_size,
        customer_name: 'Client',
        customer_phone: undefined,
        status: delivery.status,
        created_at: delivery.created_at
      })) || [];

      // Combine and sort by creation time
      const allDeliveries = [...formattedMarketplace, ...formattedDirect]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setDeliveries(allDeliveries);

    } catch (error: any) {
      console.error('Error loading deliveries:', error);
      toast.error('Erreur lors du chargement des livraisons');
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (deliveryId: string, type: 'marketplace' | 'direct') => {
    if (!user) return false;

    setLoading(true);
    try {
      if (type === 'marketplace') {
        const { error } = await supabase
          .from('marketplace_delivery_assignments')
          .update({
            driver_id: user.id,
            assignment_status: 'assigned'
          })
          .eq('id', deliveryId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_orders')
          .update({
            driver_id: user.id,
            status: 'driver_assigned'
          })
          .eq('id', deliveryId);

        if (error) throw error;
      }

      // Set as active delivery and update local status for UI flow
      const accepted = deliveries.find(d => d.id === deliveryId);
      if (accepted) {
        const normalizedStatus = type === 'marketplace' ? 'assigned' : 'confirmed';
        setActiveDelivery({ ...accepted, status: normalizedStatus });
        setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      }

      toast.success('Livraison acceptée');
      return true;

    } catch (error: any) {
      console.error('Error accepting delivery:', error);
      toast.error(error?.message || 'Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (status: string, completionData?: DeliveryCompletionData) => {
    if (!activeDelivery || !user) return false;

    setLoading(true);
    try {
      // Si statut = delivered/completed, utiliser complete-ride-with-commission
      if (status === 'delivered' || status === 'completed') {
        console.log('📦 Completion livraison via complete-ride-with-commission (APPEL UNIQUE)');
        
        const { data, error } = await supabase.functions.invoke(
          'complete-ride-with-commission',
          {
            body: {
              rideId: activeDelivery.id,
              rideType: 'delivery',
              driverId: user.id,
              finalAmount: activeDelivery.estimated_fee || 0,
              paymentMethod: 'cash',
              // Ajouter les données de preuve de livraison si fournies
              deliveryProof: completionData ? {
                recipient_name: completionData.recipientName,
                notes: completionData.notes,
                photo_url: completionData.photoUrl,
                delivery_time: new Date().toISOString()
              } : undefined
            }
          }
        );

        if (error) throw error;

        // NE PAS refaire de mise à jour séparée
        // complete-ride-with-commission gère déjà la mise à jour du statut
        // On met juste à jour localement pour l'UI
        if (activeDelivery.type === 'marketplace') {
          console.log('📦 Marketplace delivery completed via commission function');
        } else {
          console.log('📦 Direct delivery completed via commission function');
        }

        setActiveDelivery(null);
        
        // Afficher le résultat selon le mode de facturation
        if (data?.billing_mode === 'subscription') {
          toast.success('🎉 Livraison terminée (Abonnement)', {
            description: `Courses restantes: ${data.rides_remaining}`
          });
        } else {
          toast.success('🎉 Livraison terminée avec commission !', {
            description: `Net: ${data?.driver_net_amount?.toLocaleString() || 0} CDF`
          });
        }
        
        return true;
      }

      // Sinon, mise à jour normale du statut
      if (activeDelivery.type === 'marketplace') {
        const { error } = await supabase
          .from('marketplace_delivery_assignments')
          .update({ assignment_status: status })
          .eq('id', activeDelivery.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_orders')
          .update({ status })
          .eq('id', activeDelivery.id);

        if (error) throw error;
      }

      setActiveDelivery(prev => prev ? { ...prev, status } : null);
      toast.success('Statut mis à jour');
      return true;

    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      toast.error(error?.message || 'Erreur lors de la mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const marketplaceChannel = supabase
      .channel('marketplace-deliveries')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'marketplace_delivery_assignments',
        filter: 'assignment_status=eq.pending'
      }, () => {
        loadAvailableDeliveries();
        toast.info('Nouvelle livraison marketplace disponible');
      })
      .subscribe();

    const directChannel = supabase
      .channel('direct-deliveries')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_orders'
      }, (payload) => {
        if ((payload.new as any).status === 'pending' && !(payload.new as any).driver_id) {
          loadAvailableDeliveries();
          toast.info('Nouvelle livraison directe disponible');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(marketplaceChannel);
      supabase.removeChannel(directChannel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAvailableDeliveries();
    }
  }, [user]);

  // GPS continu pendant la livraison active
  useEffect(() => {
    if (!activeDelivery || !user?.id) return;
    if (!['driver_assigned', 'picked_up', 'in_transit'].includes(activeDelivery.status)) return;

    let watchId: number | null = null;

    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            if (position.coords.latitude === 0 && position.coords.longitude === 0) return;
            await supabase
              .from('driver_locations')
              .upsert({
                driver_id: user.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
                accuracy: position.coords.accuracy,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'driver_id' });
          } catch (err) {
            console.warn('GPS sync error:', err);
          }
        },
        (err) => console.warn('GPS watch error:', err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    };

    startTracking();
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDelivery?.status, user?.id]);

  return {
    loading,
    deliveries,
    activeDelivery,
    acceptDelivery,
    updateDeliveryStatus,
    loadAvailableDeliveries
  };
};