/**
 * 🚀 Hook Unifié de Dispatch pour Chauffeurs
 * PHASE 1: Fusionne useUnifiedDispatcher + useDriverOrderNotifications
 * 
 * Gère TOUTES les commandes (taxi, delivery, marketplace) de manière unifiée
 * avec protection atomique contre les race conditions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDriverStatus } from './useDriverStatus';
import { toast } from 'sonner';
import { driverNotificationService } from '@/services/driverNotificationService';

export interface UnifiedOrderNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace' | 'delivery_assignment';
  orderId: string;
  title: string;
  message: string;
  location: string;
  estimatedPrice: number;
  distance?: number;
  urgency: 'low' | 'medium' | 'high';
  data: any;
  created_at: string;
  expires_at?: string;
  assignment_version?: number;
}

export const useDriverDispatch = () => {
  const { user } = useAuth();
  const { status: driverStatus, markBusy, markAvailable } = useDriverStatus();
  const [loading, setLoading] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<UnifiedOrderNotification[]>([]);
  const rejectedIdsRef = useRef<Set<string>>(new Set());
  const cancelledIdsRef = useRef<Set<string>>(new Set());
  const isAcceptingRef = useRef(false);
  const isCompletingRef = useRef(false);
  const notifStartedRef = useRef(false);
  const notifDriverIdRef = useRef<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Refs synchronisées — permettent à loadActiveOrders d'être stable (deps vides)
  const userRef = useRef(user);
  const driverStatusRef = useRef(driverStatus);
  const markBusyRef = useRef(markBusy);
  const markAvailableRef = useRef(markAvailable);
  useEffect(() => {
    userRef.current = user;
    driverStatusRef.current = driverStatus;
    markBusyRef.current = markBusy;
    markAvailableRef.current = markAvailable;
  }, [user, driverStatus, markBusy, markAvailable]);

  // ✅ Charger les commandes actives
  const loadActiveOrders = useCallback(async () => {
    const user = userRef.current;
    if (!user) return;

    try {
      const [{ data: taxiRides }, { data: deliveries }, { data: marketplaceDeliveries }] = await Promise.all([
        supabase
          .from('transport_bookings')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['driver_assigned', 'accepted', 'driver_arrived', 'pickup', 'picked_up', 'in_progress']),
        supabase
          .from('delivery_orders')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['driver_assigned', 'confirmed', 'picked_up', 'in_transit']),
        supabase
          .from('marketplace_delivery_assignments')
          .select(`
            *,
            marketplace_orders(
              *,
              marketplace_products(title, price)
            )
          `)
          .eq('driver_id', user.id)
          .in('assignment_status', ['assigned', 'accepted', 'picked_up']),
      ]);

      // Récupérer les profils clients pour les courses taxi
      let taxiWithProfiles = (taxiRides || []).map(r => ({ ...r, type: 'taxi' as const }));
      if (taxiRides && taxiRides.length > 0) {
        const clientIds = [...new Set(taxiRides.map(r => r.user_id))];
        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number, avatar_url')
          .in('user_id', clientIds);

        const profileMap = new Map(
          (clientProfiles || []).map(p => [p.user_id, p])
        );

        taxiWithProfiles = taxiRides.map(r => {
          const profile = profileMap.get(r.user_id);
          return {
            ...r,
            type: 'taxi' as const,
            customer_phone: profile?.phone_number || r.beneficiary_phone || null,
            customer_name: profile?.display_name || r.beneficiary_name || 'Client',
            customer_avatar: profile?.avatar_url || null
          };
        });
      }

      const allActiveOrders = [
        ...taxiWithProfiles,
        ...(deliveries || []).map(d => ({ ...d, type: 'delivery' })),
        ...(marketplaceDeliveries || []).map(m => ({ ...m, type: 'marketplace' }))
      ];

      setActiveOrders(allActiveOrders);

      // Mettre à jour le statut si nécessaire
      const driverStatus = driverStatusRef.current;
      if (allActiveOrders.length > 0 && driverStatus.isAvailable) {
        const firstOrder = allActiveOrders[0];
        markBusyRef.current(firstOrder.id, firstOrder.type as 'taxi' | 'delivery' | 'marketplace');
      } else if (allActiveOrders.length === 0 && !driverStatus.isAvailable && driverStatus.isOnline) {
        markAvailableRef.current();
      }

    } catch (error: any) {
      console.error('Error loading active orders:', error);
    }
  }, []);

  // ✅ Accepter une commande avec protection atomique
  const acceptOrder = async (notification: UnifiedOrderNotification): Promise<boolean> => {
    if (isAcceptingRef.current) return false;
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    isAcceptingRef.current = true;
    setLoading(true);
    try {
      // ✅ PHASE 2: Validation côté serveur avant acceptation
      const { validateDriverServiceType } = await import('@/services/driverNotificationRouter');
      
      const validation = await validateDriverServiceType(user.id, notification.type, notification.orderId);
      
      if (!validation.valid) {
        toast.error(`❌ ${validation.reason}`);
        console.warn('⚠️ Service type mismatch:', validation);
        setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
        setLoading(false);
        return false;
      }

      console.log(`✅ Validation passed: ${validation.driverServiceType} driver accepting ${notification.type} order`);

      let success = false;

      switch (notification.type) {
        case 'taxi':
          // Vérifier si déjà assignée
          const { data: currentBooking } = await supabase
            .from('transport_bookings')
            .select('id, driver_id, status')
            .eq('id', notification.orderId)
            .single();

          if (currentBooking?.driver_id && currentBooking.driver_id !== user.id) {
            toast.error('⚠️ Course déjà assignée à un autre chauffeur');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          // UPDATE direct status='accepted' — ride-dispatcher edge function ne gère
          // pas l'acceptation, elle ne fait que le dispatch initial (status='driver_assigned').
          console.warn('[acceptOrder/taxi] UPDATE status=accepted | bookingId:', notification.orderId, '| driverId:', user.id);
          const isReassignToSelf = currentBooking?.driver_id === user.id;
          const taxiQuery = supabase.from('transport_bookings')
            .update({ status: 'accepted', driver_id: user.id, updated_at: new Date().toISOString() })
            .eq('id', notification.orderId);
          const { data: taxiResult, error: taxiError } = isReassignToSelf
            ? await taxiQuery.eq('driver_id', user.id).select()
            : await taxiQuery.is('driver_id', null).select();
          if (taxiError) { toast.error(`❌ ${taxiError.message}`); return false; }
          if (!taxiResult || taxiResult.length === 0) { toast.error('⚠️ Course déjà acceptée'); return false; }
          success = true;
          break;

        case 'delivery':
          // ✅ Protection atomique avec assignment_version
          const { data: currentDelivery } = await supabase
            .from('delivery_orders')
            .select('id, driver_id, assignment_version, status')
            .eq('id', notification.orderId)
            .single();

          if (!currentDelivery) {
            toast.error('❌ Commande introuvable');
            return false;
          }

          if (currentDelivery.driver_id) {
            // Déjà assignée à moi → simple confirmation (acceptation)
            if (currentDelivery.driver_id === user.id) {
              const { error: confirmError } = await supabase
                .from('delivery_orders')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('id', notification.orderId)
                .eq('driver_id', user.id);
              if (confirmError) {
                console.error('Error confirming delivery:', confirmError);
                toast.error("❌ Erreur lors de la confirmation");
                return false;
              }
              success = true;
              break;
            }

            // Assignée à un autre chauffeur → refus
            await supabase.rpc('log_assignment_conflict', {
              p_order_type: 'delivery_order',
              p_order_id: notification.orderId,
              p_driver_id: user.id,
              p_conflict_reason: 'Course déjà assignée'
            });

            toast.error('⚠️ Course déjà assignée à un autre chauffeur');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          // Assignation atomique avec versioning
          const { data: updateResult, error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({ 
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString(),
              assignment_version: (currentDelivery.assignment_version || 0) + 1
            })
            .eq('id', notification.orderId)
            .eq('assignment_version', currentDelivery.assignment_version)
            .is('driver_id', null)
            .select();

          if (!updateResult || updateResult.length === 0) {
            await supabase.rpc('log_assignment_conflict', {
              p_order_type: 'delivery_order',
              p_order_id: notification.orderId,
              p_driver_id: user.id,
              p_conflict_reason: 'Conflit de version (race condition)'
            });

            toast.error('⚠️ Un autre chauffeur a accepté en même temps');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          if (deliveryError) {
            console.error('Error accepting delivery:', deliveryError);
            toast.error('❌ Erreur lors de l\'acceptation');
            return false;
          }

          success = true;
          break;

        case 'marketplace':
          // ✅ Protection atomique
          const { data: currentAssignment } = await supabase
            .from('marketplace_delivery_assignments')
            .select('id, driver_id, assignment_status')
            .eq('id', notification.orderId)
            .single();

          if (!currentAssignment || currentAssignment.driver_id) {
            toast.error('⚠️ Livraison déjà assignée');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              assignment_status: 'accepted'
            })
            .eq('id', notification.orderId)
            .is('driver_id', null);

          if (marketplaceError) {
            console.error('Error accepting marketplace delivery:', marketplaceError);
            toast.error('❌ Impossible d\'accepter la livraison');
            return false;
          }

          success = true;
          break;

        case 'delivery_assignment': {
          // Livraison déjà assignée à ce chauffeur — il confirme l'acceptation
          const { error: assignmentError } = await supabase
            .from('delivery_orders')
            .update({ status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', notification.orderId)
            .eq('driver_id', user.id);
          if (assignmentError) {
            console.error('Error confirming delivery assignment:', assignmentError);
            toast.error("❌ Erreur lors de la confirmation");
            return false;
          }
          success = true;
          break;
        }
      }

      if (success) {
        // Retirer la notification
        setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));

        // Ajouter (ou mettre à jour) la commande active
        const acceptedStatus = notification.type === 'delivery_assignment' ? 'confirmed' : 'accepted';
        setActiveOrders(prev => {
          const already = prev.some(o => o.id === notification.orderId);
          if (already) {
            return prev.map(o => o.id === notification.orderId ? { ...o, status: acceptedStatus } : o);
          }
          return [...prev, {
            ...notification.data,
            id: notification.orderId,
            type: notification.type === 'delivery_assignment' ? 'delivery' : notification.type,
            status: acceptedStatus,
          }];
        });

        // Marquer comme occupé
        await markBusy(notification.orderId, notification.type);
        
        toast.success('✅ Course acceptée !');
        
        // Logger le succès
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          activity_type: 'order_accepted',
          description: `${notification.type} accepté`,
          reference_type: notification.type,
          reference_id: notification.orderId
        });

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error(`❌ Erreur: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
      isAcceptingRef.current = false;
    }
  };

  // ✅ Refuser une commande (timeout 15s OU decline manuel)
  // Restaure is_available=true en DB pour que le driver soit à nouveau éligible
  // au dispatch (le ride-dispatcher l'avait passé à false lors de l'attribution).
  const rejectOrder = async (notificationId: string) => {
    rejectedIdsRef.current.add(notificationId);
    setPendingNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (user) {
      const { error } = await supabase
        .from('driver_locations')
        .update({
          is_available: true,
          updated_at: new Date().toISOString(),
        })
        .eq('driver_id', user.id);
      if (error) console.warn('[rejectOrder] failed to restore is_available:', error.message);
    }
    toast.info('Commande refusée');
  };

  // ✅ Terminer une commande
  const completeOrder = async (orderId: string, type: 'taxi' | 'delivery' | 'marketplace'): Promise<boolean> => {
    if (isCompletingRef.current) return false;
    isCompletingRef.current = true;
    setLoading(true);
    try {
      let success = false;

      switch (type) {
        case 'taxi':
          const { data: taxiBooking } = await supabase
            .from('transport_bookings')
            .select('estimated_price, actual_price, client_proposed_price, waiting_fee')
            .eq('id', orderId)
            .single();
          const finalAmount = (taxiBooking?.actual_price || taxiBooking?.client_proposed_price || taxiBooking?.estimated_price || 0) + (taxiBooking?.waiting_fee || 0);
          const { error: taxiCompleteError } = await supabase
            .from('transport_bookings')
            .update({ status: 'completed', completed_at: new Date().toISOString(), actual_price: finalAmount })
            .eq('id', orderId)
            .eq('driver_id', user?.id);
          if (taxiCompleteError) {
            console.error('[completeOrder/taxi] failed:', taxiCompleteError);
            toast.error('Erreur de finalisation: ' + taxiCompleteError.message);
            success = false;
          } else {
            console.warn('[completeOrder/taxi] OK', orderId);
            success = true;
            supabase.functions.invoke('complete-ride-with-commission', {
              body: {
                rideId: orderId,
                rideType: 'transport',
                driverId: user!.id,
                finalAmount: finalAmount,
                paymentMethod: 'cash',
              },
            }).catch((e) => console.warn('commission call failed', e));
          }
          break;

        case 'delivery': {
          // Récupérer le montant de la livraison
          const { data: deliveryOrder } = await supabase
            .from('delivery_orders')
            .select('estimated_price, actual_price')
            .eq('id', orderId)
            .single();

          const deliveryAmount = deliveryOrder?.actual_price || deliveryOrder?.estimated_price || 0;

          const { error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({ status: 'delivered', completed_at: new Date().toISOString() })
            .eq('id', orderId)
            .eq('driver_id', user?.id);

          if (deliveryError) {
            console.error('[completeOrder/delivery] failed:', deliveryError);
            toast.error('Erreur lors de la finalisation');
          } else {
            success = true;
            supabase.functions.invoke('complete-ride-with-commission', {
              body: {
                rideId: orderId,
                rideType: 'delivery',
                driverId: user!.id,
                finalAmount: deliveryAmount,
                paymentMethod: 'cash',
              },
            }).catch((e) => console.warn('commission call failed', e));
          }
          break;
        }

        case 'marketplace':
          // Récupérer le montant de la livraison marketplace
          const { data: marketplaceOrder } = await supabase
            .from('marketplace_delivery_assignments')
            .select('delivery_fee')
            .eq('id', orderId)
            .single();

          const marketplaceAmount = marketplaceOrder?.delivery_fee || 0;

          // Appeler complete-ride-with-commission (unifié taxi/livraison/marketplace)
          const { data: marketplaceResult, error: marketplaceError } = await supabase.functions.invoke(
            'complete-ride-with-commission',
            {
              body: {
                rideId: orderId,
                rideType: 'delivery', // Marketplace = delivery type
                driverId: user!.id,
                finalAmount: marketplaceAmount,
                paymentMethod: 'cash'
              }
            }
          );

          if (!marketplaceError && marketplaceResult?.success) {
            // Mettre à jour le statut marketplace
            await supabase
              .from('marketplace_delivery_assignments')
              .update({
                assignment_status: 'delivered',
                actual_delivery_time: new Date().toISOString()
              })
              .eq('id', orderId);

            success = true;
          } else {
            console.warn('complete-ride-with-commission (marketplace) failed, fallback:', marketplaceError);
            const { error: marketplaceFallbackError } = await supabase
              .from('marketplace_delivery_assignments')
              .update({
                assignment_status: 'delivered',
                actual_delivery_time: new Date().toISOString()
              })
              .eq('id', orderId);
            if (!marketplaceFallbackError) {
              success = true;
            } else {
              console.error('Marketplace fallback also failed:', marketplaceFallbackError);
              toast.error('Erreur lors de la finalisation');
            }
          }
          break;
      }

      if (success) {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        await markAvailable();
        toast.success('🎉 Course terminée !');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error('❌ Erreur lors de la finalisation');
      return false;
    } finally {
      setLoading(false);
      isCompletingRef.current = false;
    }
  };

  // ✅ PHASE 7: Utiliser le service de notifications robuste
  useEffect(() => {
    if (!user || !driverStatus.isOnline) {
      if (notifStartedRef.current) {
        driverNotificationService.stop();
        notifStartedRef.current = false;
        notifDriverIdRef.current = null;
      }
      return;
    }

    console.log('🎧 Écoute unifiée via notification service:', user.id);

    // Ne pas redémarrer le service s'il tourne déjà pour ce chauffeur
    if (!notifStartedRef.current || notifDriverIdRef.current !== user.id) {
      driverNotificationService.start(user.id);
      notifStartedRef.current = true;
      notifDriverIdRef.current = user.id;
    }

    const unsubscribe = driverNotificationService.subscribe((notification: any) => {
      const unifiedNotif: UnifiedOrderNotification = {
        id: notification.id,
        type: notification.type,
        orderId: notification.orderId,
        title: notification.title,
        message: notification.message,
        location: notification.data?.pickup_location || '',
        estimatedPrice: notification.data?.estimated_price || 0,
        urgency: 'medium',
        data: notification.data,
        created_at: new Date().toISOString()
      };
      
      console.warn('[Dispatch] Adding notif:', { id: unifiedNotif.id, type: unifiedNotif.type, orderId: unifiedNotif.orderId });
      setPendingNotifications(prev => {
        if (rejectedIdsRef.current.has(unifiedNotif.id)) return prev;
        if (prev.some(n => n.id === unifiedNotif.id)) return prev;
        return [unifiedNotif, ...prev];
      });
    });

    const unsubscribeCancel = driverNotificationService.subscribeToCancellation((data) => {
      console.log('🛑 [Driver] Cancellation received for order:', data.orderId);
      cancelledIdsRef.current.add(data.orderId);
      setPendingNotifications(prev => prev.filter(n => n.orderId !== data.orderId));
      setActiveOrders(prev => prev.filter(o => o.id !== data.orderId));
      markAvailableRef.current();
      toast.info('Course annulée par le client');
    });

    const unsubscribeStatus = driverNotificationService.subscribeToStatusChanges((orderId, newStatus) => {
      if (newStatus === 'cancelled') {
        cancelledIdsRef.current.add(orderId);
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        markAvailableRef.current();
        return;
      }
    });

    return () => {
      unsubscribe();
      unsubscribeCancel();
      unsubscribeStatus();
    };
  }, [user, driverStatus.isOnline]);

  // ✅ Charger les commandes actives au montage
  useEffect(() => {
    if (user) {
      loadActiveOrders();
    }
  }, [user, loadActiveOrders]);

  return {
    loading,
    pendingNotifications,
    setPendingNotifications,
    activeOrders,
    setActiveOrders,
    acceptOrder,
    rejectOrder,
    completeOrder,
    loadActiveOrders
  };
};
