import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, X, Zap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DriverArrivalButton } from './DriverArrivalButton';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { DriverOfferSheet } from './DriverOfferSheet';
import { ModernBiddingCard } from './ModernBiddingCard';
import { notificationSoundService } from '@/services/notificationSound';
interface RideNotification {
  id: string;
  title: string;
  message: string;
  distance: number;
  estimatedTime: number;
  expiresIn: number;
  status?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  estimatedPrice?: number;
  vehicleClass?: string;
  ridesRemaining?: number;
  biddingMode?: boolean;
  offerCount?: number;
  biddingClosesAt?: string;
  clientProposedPrice?: number;
  distanceToPickup?: number;
}

// Helper pour calculer temps restant
const getRemainingTime = (closesAt: string): string => {
  const remaining = new Date(closesAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expiré';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const haversineKm = (a: any, b: any): number => {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return 0;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const computeTripDistance = (meta: any): number => {
  const pickup = meta?.pickupCoords;
  const dest = meta?.destinationCoords;
  if (pickup?.lat && pickup?.lng && dest?.lat && dest?.lng) {
    return haversineKm(pickup, dest);
  }
  return meta?.distance || 0;
};

export default function DriverRideNotifications() {
  const { user } = useAuth();
  const { currentSubscription, refreshSubscription } = useDriverSubscriptions();
  const [notifications, setNotifications] = useState<RideNotification[]>([]);
  const notificationsRef = useRef<RideNotification[]>([]);
  // Sync ref to avoid stale closures in polling
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  const [acceptedRides, setAcceptedRides] = useState<Map<string, boolean>>(new Map());
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<RideNotification | null>(null);

  // Load real-time notifications from Supabase
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up ride notifications for driver:', user.id);

    // Load pending notifications
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('notification_type', 'ride_bidding')
        .eq('is_sent', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} pending ride notifications`);

        const bookingIds = (data as any[])
          .map(n => n.transport_booking_id || n.reference_id)
          .filter(Boolean);

      // Filtrer: ne pas montrer les notifications dont la course est déjà terminée
      let validBookingIds = bookingIds;
      if (bookingIds.length > 0) {
        const { data: bookings } = await supabase
          .from('transport_bookings')
          .select('id, status, driver_id')
          .in('id', bookingIds);
        const doneStatuses = ['accepted', 'pickup', 'in_progress', 'completed', 'cancelled'];
        validBookingIds = bookingIds.filter(id => {
          const b = (bookings || []).find((x: any) => x.id === id);
          if (!b) return true; // inconnu → laisser passer
          if (doneStatuses.includes(b.status)) return false; // terminé → masquer
          if (b.driver_id && b.driver_id !== user.id) return false; // pris par un autre → masquer
          return true;
        });
      }
        const bookingsMap = new Map<string, any>();
        if (bookingIds.length > 0) {
          const { data: bookings } = await supabase
            .from('transport_bookings')
            .select('id,pickup_location,destination,estimated_price,client_proposed_price,bidding_mode,bidding_closes_at')
            .in('id', bookingIds);
          for (const b of (bookings as any[]) || []) {
            bookingsMap.set(b.id, b);
          }
        }

        const seen = new Set<string>();
        const mappedNotifications: RideNotification[] = [];
        for (const notif of data as any[]) {
          const id = notif.transport_booking_id || notif.reference_id || notif.id;
          if (seen.has(id)) continue;
          // Skip si booking terminé/annulé/pris
          if (!validBookingIds.includes(id)) continue;
          seen.add(id);
          const isBidding = notif.notification_type === 'ride_bidding' ||
                            notif.metadata?.biddingMode === true;
          const booking = bookingsMap.get(id);
          mappedNotifications.push({
            id,
            title: isBidding ? '🎯 Mode Enchères' : notif.title,
            message: notif.message,
            distance: computeTripDistance(notif.metadata),
            estimatedTime: Math.ceil(computeTripDistance(notif.metadata) * 3),
            expiresIn: isBidding ? 180 : 120,
            pickupAddress: booking?.pickup_location?.split(',')[0].trim() || '',
            destinationAddress: booking?.destination?.split(',')[0].trim() || '',
            estimatedPrice: booking?.estimated_price,
            vehicleClass: notif.metadata?.vehicleClass,
            ridesRemaining: notif.metadata?.rides_remaining,
            status: 'pending',
            biddingMode: isBidding,
            offerCount: notif.metadata?.offerCount || 0,
            biddingClosesAt: booking?.bidding_closes_at,
            clientProposedPrice: booking?.client_proposed_price,
            distanceToPickup: notif.metadata?.distanceToPickup || notif.metadata?.distance || 0,
          });
        }

        // Dédupliquer aussi par rapport à l'état existant
        setNotifications(prev => {
          const existing = new Set(prev.map(p => p.id));
          const fresh = mappedNotifications.filter(n => !existing.has(n.id));
          if (fresh.length > 0) window.dispatchEvent(new CustomEvent('bidding-popup-open'));
          return [...prev, ...fresh];
        });
      }
    };

    loadNotifications();

    // Real-time subscription for new ride assignments
    const channel = supabase
      .channel(`driver-ride-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notifications',
          // No filter= on Realtime (unstable). Client-side filtering below.
        },
        async (payload) => {
          const newNotif = payload.new as any;
          // Filtre client-side: uniquement les notifications de ce chauffeur
          if (newNotif.user_id !== user.id) return;
          const isBidding = newNotif.notification_type === 'ride_bidding' ||
                            newNotif.metadata?.biddingMode === true;

          if (newNotif.notification_type === 'ride_bidding') {
            const bookingId = newNotif.transport_booking_id || newNotif.reference_id;
            let booking: any = null;
            if (bookingId) {
              const { data: bookingData } = await supabase
                .from('transport_bookings')
                .select('id,pickup_location,destination,estimated_price,client_proposed_price,bidding_mode,bidding_closes_at,status,driver_id')
                .eq('id', bookingId)
                .maybeSingle();
              booking = bookingData;
              // Ignorer si course déjà terminée ou prise par un autre chauffeur
              const DONE = ['accepted','pickup','in_progress','completed','cancelled'];
              if (booking && DONE.includes(booking.status)) return;
              if (booking?.driver_id && booking.driver_id !== user.id) return;
            }
            const notification: RideNotification = {
              id: newNotif.transport_booking_id || newNotif.reference_id || newNotif.id,
              title: isBidding ? '🎯 Mode Enchères' : newNotif.title,
              message: newNotif.message,
              distance: computeTripDistance(newNotif.metadata),
              estimatedTime: Math.ceil(computeTripDistance(newNotif.metadata) * 3),
              expiresIn: isBidding ? 180 : 120,
              pickupAddress: booking?.pickup_location?.split(',')[0].trim() || '',
              destinationAddress: booking?.destination?.split(',')[0].trim() || '',
              estimatedPrice: booking?.estimated_price,
              vehicleClass: newNotif.metadata?.vehicleClass,
              ridesRemaining: newNotif.metadata?.rides_remaining,
              status: 'pending',
              biddingMode: isBidding,
              offerCount: newNotif.metadata?.offerCount || 0,
              biddingClosesAt: booking?.bidding_closes_at,
              clientProposedPrice: booking?.client_proposed_price,
              distanceToPickup: newNotif.metadata?.distanceToPickup || newNotif.metadata?.distance || 0
            };

            setNotifications(prev => {
              if (prev.some(p => p.id === notification.id)) return prev;
              return [notification, ...prev];
            });
            
            // 🔊 Son professionnel selon le type
            notificationSoundService.playNotificationSound(
              isBidding ? 'urgentAlert' : 'driverAssigned'
            );

            // Notification browser native
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(
                isBidding ? '🎯 Nouvelle enchère !' : '🚗 Nouvelle course !',
                {
                  body: `${notification.pickupAddress || 'Course'} • ${notification.estimatedPrice?.toLocaleString()} CDF`,
                  icon: '/logo.png',
                  badge: '/logo.png',
                  tag: `ride-${notification.id}`,
                  requireInteraction: false
                }
              );
            }

            toast(isBidding ? '🎯 Nouvelle enchère disponible !' : '🚗 Nouvelle course disponible !', {
              description: isBidding
                ? `${notification.estimatedPrice?.toLocaleString()} CDF • ${notification.distance.toFixed(1)}km`
                : `Distance: ${notification.distance.toFixed(1)}km`,
              duration: isBidding ? 8000 : 6000,
              id: `ride-${notification.id}`
            });
          }
        }
      )
      .subscribe();

    // Dismiss notifications when this driver's offer is accepted by the client
    const dismissChannel = supabase
      .channel(`driver-offer-accepted-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_offers'
        },
        (payload) => {
          const row = payload.new as any;
          if (row.driver_id !== user.id) return;
          if (row.status !== 'accepted') return;
          const bookingId = row.booking_id;
          setNotifications(prev => prev.filter(n => n.id !== bookingId));
          setShowOfferSheet(false);
          setSelectedOffer(null);
          window.dispatchEvent(new CustomEvent('ride-accepted', { detail: { bookingId } }));
        }
      )
      .subscribe();

    // Listen for ride-accepted to dismiss the matching notification
    const handleRideAccepted = (e: any) => {
      const bookingId = e?.detail?.bookingId;
      if (!bookingId) return;
      setNotifications(prev => prev.filter(notif => notif.id !== bookingId));
    };
    window.addEventListener('ride-accepted', handleRideAccepted);

    // Timer for expiration
    const timerInterval = setInterval(() => {
      setNotifications(prev =>
        prev
          .map(n => ({ ...n, expiresIn: n.expiresIn - 1 }))
          .filter(n => n.expiresIn > 0)
      );
    }, 1000);

    // POLLING: vérifie transport_bookings toutes les 3s
    // Ne dépend pas de ride_offers ni de Realtime
    const pollInterval = setInterval(async () => {
      const notifs = notificationsRef.current;
      if (!notifs.length) return;
      const ids = notifs.map((n: any) => n.id).filter(Boolean);
      if (!ids.length) return;
      const { data } = await supabase
        .from('transport_bookings')
        .select('id, status, driver_id')
        .in('id', ids)
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'pickup', 'in_progress', 'completed']);
      (data || []).forEach((row: any) => {
        setNotifications(prev => prev.filter((n: any) => n.id !== row.id));
        setShowOfferSheet(false);
        setSelectedOffer(null);
        window.dispatchEvent(new CustomEvent('ride-accepted', { detail: { bookingId: row.id } }));
      });
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dismissChannel);
      window.removeEventListener('ride-accepted', handleRideAccepted);
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [user]);

  const handleAccept = async (id: string) => {
    if (!user) return;

    try {
      // Mark as accepted in UI immediately
      setAcceptedRides(prev => new Map(prev).set(id, true));

      // Update booking status
      const { data: updateData, error } = await supabase
        .from('transport_bookings')
        .update({
          status: 'accepted',
          driver_id: user.id,
          assigned_driver_id: user.id,
          driver_assigned_at: new Date().toISOString(),
          bidding_mode: false
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!updateData?.length) { toast.error('Aucune ligne modifiée — RLS'); return; }

      // Mark notification as sent
      await supabase
        .from('push_notifications')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('notification_type', 'ride_bidding')
        .eq('is_sent', false);

      toast.success('✅ Course acceptée !', {
        description: 'Dirigez-vous vers le client. Le crédit sera défalqué à votre arrivée.'
      });
      setNotifications([]);
      setAcceptedRides(new Map());
      window.dispatchEvent(new CustomEvent('ride-accepted', { detail: { bookingId: id } }));
      window.dispatchEvent(new CustomEvent('bidding-closed', { detail: { bookingId: id } }));

    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Erreur lors de l\'acceptation de la course');
      setAcceptedRides(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  };

  const handleIgnore = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (user) {
      await supabase
        .from('push_notifications')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('transport_booking_id', id)
        .eq('user_id', user.id);
    }
    window.dispatchEvent(new CustomEvent('bidding-closed', { detail: { bookingId: id } }));
    toast.info('Course ignorée');
  };

  const handleArrivalConfirmed = (bookingId: string, ridesRemaining: number) => {
    // Remove notification after arrival confirmed
    setNotifications(prev => prev.filter(n => n.id !== bookingId));
    setAcceptedRides(prev => {
      const newMap = new Map(prev);
      newMap.delete(bookingId);
      return newMap;
    });
    
    // Refresh subscription to show updated credits
    refreshSubscription();
    
    toast.success('✅ Course démarrée !', {
      description: `Crédits restants: ${ridesRemaining}`
    });
  };

  const handleMakeOffer = (notification: RideNotification) => {
    setSelectedOffer(notification);
    setShowOfferSheet(true);
  };

  if (notifications.length === 0 && acceptedRides.size === 0) {
    return null;
  }

  // Une seule carte à la fois → la plus récente
  const currentNotif = notifications[0];

  return (
    <>
      {!showOfferSheet && (
      <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm">
      <div className="max-w-sm mx-auto mt-20 px-4 space-y-4">
        {/* Display credits badge */}
        {currentSubscription && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{currentSubscription.rides_remaining}</span>
              <span className="text-muted-foreground">courses restantes</span>
            </Badge>
          </div>
        )}

        {/* Indicateur file d'attente */}
        {notifications.length > 1 && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/90 text-gray-800 text-xs font-semibold shadow-sm">
              1 sur {notifications.length}
            </span>
          </div>
        )}

        {currentNotif && (() => {
          const notification = currentNotif;
          const isAccepted = acceptedRides.get(notification.id);

        // Use ModernBiddingCard for ALL notifications (bidding mode or not)
        // Drivers can always propose their own price
        if (!isAccepted) {
          return (
            <ModernBiddingCard
              key={notification.id}
              bookingId={notification.id}
              pickupAddress={notification.pickupAddress || ''}
              destinationAddress={notification.destinationAddress || ''}
              distance={notification.distance}
              estimatedPrice={notification.estimatedPrice || 0}
              clientProposedPrice={notification.clientProposedPrice}
              offerCount={notification.offerCount || 0}
              biddingClosesAt={notification.biddingClosesAt}
              distanceToPickup={notification.distanceToPickup}
              isBiddingMode={notification.biddingMode || false}
              onAcceptTembeaPrice={() => handleAccept(notification.id)}
              onMakeOffer={() => handleMakeOffer(notification)}
              onIgnore={() => handleIgnore(currentNotif.id)}
            />
          );
        }
        
        return (
        <Card
          key={notification.id} 
          className={`border shadow-lg transition-all ${
            isAccepted ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-primary'
          }`}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-full ${
                isAccepted ? 'bg-green-500/20' : 'bg-primary/10'
              }`}>
                <MapPin className={`h-4 w-4 ${isAccepted ? 'text-green-600' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-xs text-muted-foreground">{notification.vehicleClass || notification.message}</p>
              </div>
              {isAccepted && (
                <Badge variant="default" className="bg-green-500">
                  Acceptée
                </Badge>
              )}
            </div>

            {/* Route Info */}
            <div className="space-y-2 mb-4 bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Départ</p>
                  <p className="text-muted-foreground truncate">
                    {notification.pickupAddress || 'Adresse de départ'}
                  </p>
                </div>
              </div>
              <div className="ml-1 border-l border-dashed h-4" />
              <div className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Arrivée</p>
                  <p className="text-muted-foreground truncate">
                    {notification.destinationAddress || 'Adresse d\'arrivée'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="bg-background rounded p-2 text-center">
                <MapPin className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">{notification.distance.toFixed(1)} km</p>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <Clock className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">~{notification.estimatedTime} min</p>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <DollarSign className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">{notification.estimatedPrice?.toLocaleString() || '-'} CDF</p>
              </div>
            </div>

            {/* Info bénéficiaire si course pour autrui */}
            {(notification as any).bookedForOther && (
              <div className="mt-3 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                  ⚠️ Course réservée pour un tiers
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Bénéficiaire :</strong> {(notification as any).beneficiaryName}</p>
                  <p><strong>Téléphone :</strong> {(notification as any).beneficiaryPhone}</p>
                </div>
              </div>
            )}

            {/* Badge mode bidding */}
            {notification.biddingMode && !isAccepted && (
              <Badge variant="outline" className="mb-3 bg-primary/10 border-primary/30">
                🎯 Mode enchères • {notification.offerCount || 0} offre{(notification.offerCount || 0) > 1 ? 's' : ''}
              </Badge>
            )}

            {!isAccepted ? (
              <>
                {/* Timer */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-destructive h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(notification.expiresIn / 120) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono">{notification.expiresIn}s</span>
                </div>

                {/* Action Buttons */}
                {notification.biddingMode ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center py-1">
                      🎯 Mode Enchères • {notification.offerCount || 0} offre(s)
                    </Badge>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleMakeOffer(notification)}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      💰 Faire une offre
                    </Button>
                    
                    {notification.biddingClosesAt && (
                      <p className="text-xs text-center text-muted-foreground">
                        ⏱️ Expire dans {getRemainingTime(notification.biddingClosesAt)}
                      </p>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleIgnore(notification.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Ignorer
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleIgnore(notification.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(notification.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accepter
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-3 text-xs">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    ℹ️ Dirigez-vous vers le client
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Le crédit sera déduit lorsque vous confirmerez votre arrivée à moins de 100m du client.
                  </p>
                </div>

                {/* Arrival Button */}
                <DriverArrivalButton
                  bookingId={notification.id}
                  ridesRemaining={notification.ridesRemaining || currentSubscription?.rides_remaining || 0}
                  onArrivalConfirmed={(remaining) => handleArrivalConfirmed(notification.id, remaining)}
                  className="w-full"
                />
              </>
            )}
          </CardContent>
        </Card>
        );
        })()}
      </div>
    </div>
      )}

      {/* Sheet pour faire une offre */}
      {selectedOffer && (
        <div className="z-[500]">
          <DriverOfferSheet
            open={showOfferSheet}
            onOpenChange={(open) => {
              if (!open) {
                setShowOfferSheet(false);
                setSelectedOffer(null);
              } else {
                setShowOfferSheet(open);
              }
            }}
            bookingId={selectedOffer.id}
            estimatedPrice={selectedOffer.estimatedPrice || 0}
            distance={selectedOffer.distance}
            pickupAddress={selectedOffer.pickupAddress || 'Adresse de départ'}
            destinationAddress={selectedOffer.destinationAddress || 'Adresse d\'arrivée'}
            offerCount={selectedOffer.offerCount}
          />
        </div>
      )}
    </>
  );
}