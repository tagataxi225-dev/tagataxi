import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliveryAssignment {
  id: string;
  assignment_status: string;
  driver_id: string | null;
  estimated_pickup_time: string | null;
  estimated_delivery_time: string | null;
  actual_pickup_time: string | null;
  driver?: {
    display_name: string;
    phone_number: string;
    vehicle_type: string;
  };
}

export const useRestaurantDelivery = () => {
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);

  const requestDelivery = async (
    orderId: string, 
    serviceType: 'flash' | 'flex' | 'maxicharge' = 'flash'
  ) => {
    setLoading(true);
    try {
      console.log('🍽️ Requesting TAGA delivery for order:', orderId, 'service:', serviceType);

      // ✅ Edge function avec support du type de service
      const { data, error } = await supabase.functions.invoke('request-food-delivery', {
        body: { orderId, serviceType }
      });

      if (error) {
        console.error('Error invoking function:', error);
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        toast.success('🚚 Livreur TAGA recherché', {
          description: `Frais estimés: ${data.estimatedDeliveryFee?.toLocaleString()} CDF`,
        });
        return { 
          success: true, 
          estimatedFee: data.estimatedDeliveryFee,
          distance: data.distance
        };
      } else {
        throw new Error('Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error requesting delivery:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de demander un livreur',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const startSelfDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({
          status: 'in_transit',  // Statut valide - restaurant livre lui-même
          driver_id: null,       // Pas de livreur Tembea assigné
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('🚗 Livraison démarrée', {
        description: 'Vous livrez vous-même cette commande',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error starting self delivery:', error);
      toast.error('Erreur', {
        description: error.message,
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const completeDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('✅ Livraison terminée', {
        description: 'La commande a été marquée comme livrée',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      toast.error('Erreur', {
        description: error.message,
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatus = async (orderId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('food_delivery_assignments')
        .select(`
          *,
          driver:driver_profiles(display_name, phone_number, vehicle_type)
        `)
        .eq('food_order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setAssignment(data as any);
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching delivery status:', error);
      return null;
    }
  };

  const cancelDelivery = async (assignmentId: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('food_delivery_assignments')
        .update({
          assignment_status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Livraison annulée', {
        description: 'L\'assignation a été annulée',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling delivery:', error);
      toast.error('Erreur', {
        description: error.message,
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    assignment,
    requestDelivery,
    startSelfDelivery,
    completeDelivery,
    getDeliveryStatus,
    cancelDelivery
  };
};