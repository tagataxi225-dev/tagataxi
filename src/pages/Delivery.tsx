import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StepByStepDeliveryInterface from '@/components/delivery/StepByStepDeliveryInterface';
import DeliveryTrackingHub from '@/components/delivery/DeliveryTrackingHub';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRedirectPath, primaryRole } = useRoleBasedNavigation();

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const handleBook = useCallback(async (data: any) => {
    if (!user) { toast.error('Connexion requise'); return; }
    const pickup = data?.pickup?.location?.coordinates;
    const dest = data?.destination?.location?.coordinates;
    if (!pickup || !dest) { toast.error('Adresses manquantes'); return; }

    try {
      const { data: order, error } = await supabase
        .from('delivery_orders')
        .insert({
          user_id: user.id,
          pickup_location: data.pickup.location.address,
          delivery_location: data.destination.location.address,
          pickup_coordinates: pickup,
          delivery_coordinates: dest,
          delivery_type: data.mode,
          package_type: data.packageType,
          sender_name: user.user_metadata?.display_name || user.email || 'Expéditeur',
          sender_phone: data.pickup.contact?.phone || null,
          recipient_name: data.destination.contact?.name || null,
          recipient_phone: data.destination.contact?.phone || null,
          special_instructions: data.instructions || null,
          estimated_price: data.pricing?.price ?? 0,
          status: 'pending',
          city: data.city ? data.city.charAt(0).toUpperCase() + data.city.slice(1).toLowerCase() : 'Abidjan',
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success('Commande créée, recherche d\'un livreur...');
      setActiveOrderId(order.id);
    } catch (err: any) {
      toast.error('Erreur lors de la commande', { description: err.message });
    }
  }, [user]);

  const handleBack = useCallback(() => {
    navigate(getRedirectPath(primaryRole));
  }, [navigate, getRedirectPath, primaryRole]);

  if (activeOrderId) {
    return (
      <DeliveryTrackingHub
        orderId={activeOrderId}
        onBack={() => setActiveOrderId(null)}
      />
    );
  }

  return (
    <StepByStepDeliveryInterface
      onSubmit={handleBook}
      onCancel={handleBack}
    />
  );
};

export default DeliveryPage;
