import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DeliveryData {
  pickupLocation: string;
  deliveryLocation: string;
  pickupCoordinates?: { lat: number; lng: number };
  deliveryCoordinates?: { lat: number; lng: number };
  deliveryType: 'flash' | 'flex' | 'maxicharge';
  packageType?: string;
  vehicleSize?: string;
  loadingAssistance?: boolean;
  estimatedPrice: number;
  pickupTime?: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export const useDeliveryOrders = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Validation des numéros de téléphone (assouplie)
  const validatePhoneNumber = (phone: string | undefined): boolean => {
    if (!phone) return false;
    // Accepter formats internationaux et locaux
    const cleanPhone = phone.replace(/\s/g, '');
    return /^\+?[0-9]{9,15}$/.test(cleanPhone) || /^0[0-9]{9}$/.test(cleanPhone);
  };

  const createDeliveryOrder = async (data: DeliveryData) => {
    if (!user) {
      toast.error('Vous devez être connecté pour commander une livraison');
      return null;
    }

    // Validation des numéros avant envoi
    if (data.recipientPhone && !validatePhoneNumber(data.recipientPhone)) {
      toast.error('Numéro du destinataire invalide. Format: +243XXXXXXXXX');
      return null;
    }
    
    if (data.senderPhone && !validatePhoneNumber(data.senderPhone)) {
      toast.error('Numéro de l\'expéditeur invalide. Format: +243XXXXXXXXX');
      return null;
    }

    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('delivery_orders')
        .insert({
          user_id: user.id,
          pickup_location: data.pickupLocation,
          delivery_location: data.deliveryLocation,
          pickup_coordinates: data.pickupCoordinates,
          delivery_coordinates: data.deliveryCoordinates,
          delivery_type: data.deliveryType,
          package_type: data.packageType,
          vehicle_size: data.vehicleSize,
          loading_assistance: data.loadingAssistance || false,
          estimated_price: data.estimatedPrice,
          pickup_time: data.pickupTime || new Date().toISOString(),
          sender_name: data.senderName || 'Expéditeur',
          sender_phone: data.senderPhone,
          recipient_name: data.recipientName,
          recipient_phone: data.recipientPhone,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Commande de livraison créée avec succès');
      return order;
    } catch (error: any) {
      console.error('Error creating delivery order:', error);
      const errorMessage = error.message?.includes('location')
        ? 'Zone de livraison non desservie. Vérifiez les adresses.'
        : error.message?.includes('phone')
        ? 'Numéro de téléphone invalide. Format: +243XXXXXXXXX'
        : error.message?.includes('price')
        ? 'Erreur de calcul tarifaire. Contactez le support.'
        : error.message || 'Erreur lors de la création de la commande';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserDeliveryOrders = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
      toast.error('Erreur lors du chargement des commandes');
      return [];
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Statut mis à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const processDeliveryPayment = async (orderId: string, paymentMethod: 'wallet' | 'mobile_money', paymentData?: any) => {
    if (!user) return false;

    try {
      // Hold funds in escrow first
      const { data: escrowData, error: escrowError } = await supabase.functions.invoke('delivery-escrow-management', {
        body: {
          action: 'hold',
          orderId: orderId,
          userId: user.id,
          amount: paymentData.amount,
          releaseDelay: 48 // 48 hours auto-release
        }
      });

      if (escrowError) throw escrowError;

      if (paymentMethod === 'mobile_money') {
        const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
          body: {
            amount: paymentData.amount,
            provider: paymentData.provider,
            phoneNumber: paymentData.phoneNumber,
            currency: 'XOF',
            orderId: orderId,
            orderType: 'delivery'
          }
        });

        if (error) throw error;
        
        if (data.success) {
          await updateOrderStatus(orderId, 'paid');
          toast.success('Paiement effectué. Fonds sécurisés jusqu\'à la livraison.');
          return true;
        }
      } else if (paymentMethod === 'wallet') {
        const order = await supabase
          .from('delivery_orders')
          .select('*, driver_id, estimated_price')
          .eq('id', orderId)
          .single();

        if (order.data?.driver_id) {
          const { data, error } = await supabase.functions.invoke('wallet-commission', {
            body: {
              delivery_id: orderId,
              amount: order.data.estimated_price,
              service_type: 'delivery',
              driver_id: order.data.driver_id,
              user_id: user.id
            }
          });

          if (error) throw error;
          
          if (data.success) {
            toast.success('Paiement effectué. Fonds sécurisés jusqu\'à la livraison.');
            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message?.includes('insufficient')
        ? 'Solde insuffisant pour cette livraison'
        : error.message?.includes('escrow')
        ? 'Erreur de sécurisation des fonds. Réessayez.'
        : error.message?.includes('mobile money')
        ? 'Paiement mobile échoué. Vérifiez votre solde.'
        : 'Erreur lors du paiement de la livraison';
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    loading,
    createDeliveryOrder,
    getUserDeliveryOrders,
    updateOrderStatus,
    processDeliveryPayment
  };
};