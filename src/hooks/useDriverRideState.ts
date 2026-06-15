import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RidePhase =
  | 'IDLE'
  | 'INCOMING'
  | 'ACCEPTED'
  | 'AT_PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ActiveRide {
  id: string;
  type: 'taxi' | 'delivery';
  status: string;
  raw: any;
}

// Transitions autorisées — toute transition absente est rejetée
const VALID_TRANSITIONS: Record<RidePhase, RidePhase[]> = {
  IDLE: ['INCOMING', 'ACCEPTED'],
  INCOMING: ['ACCEPTED', 'CANCELLED', 'IDLE'],
  ACCEPTED: ['AT_PICKUP', 'CANCELLED'],
  AT_PICKUP: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['IDLE'],
  CANCELLED: ['IDLE'],
};

// Statut DB (taxi + livraison) → phase de la machine à états
const STATUS_TO_PHASE: Record<string, RidePhase> = {
  driver_assigned: 'INCOMING', // le chauffeur doit d'abord accepter
  accepted: 'ACCEPTED',
  confirmed: 'ACCEPTED',
  driver_arrived: 'AT_PICKUP',
  pickup: 'AT_PICKUP',
  picked_up: 'AT_PICKUP',
  in_progress: 'IN_PROGRESS',
  in_transit: 'IN_PROGRESS',
  completed: 'COMPLETED',
  delivered: 'COMPLETED',
  cancelled: 'CANCELLED',
};

const TAXI_ACTIVE = ['driver_assigned', 'accepted', 'driver_arrived', 'pickup', 'picked_up', 'in_progress'];
const DELIVERY_ACTIVE = ['driver_assigned', 'confirmed', 'picked_up', 'in_transit'];
const TERMINAL: RidePhase[] = ['COMPLETED', 'CANCELLED'];

export const useDriverRideState = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<RidePhase>('IDLE');
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const userRef = useRef(user);
  const phaseRef = useRef(phase);
  const isTransitioningRef = useRef(false);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Application directe d'une phase issue de la DB (autoritaire, sans validation)
  const syncPhase = useCallback((next: RidePhase, nextRide: ActiveRide | null) => {
    setRide(nextRide);
    setPhase(prev => (prev === next ? prev : next));
  }, []);

  // Transition optimiste déclenchée par l'UI — validée contre VALID_TRANSITIONS
  const transition = useCallback((next: RidePhase, nextRide?: ActiveRide | null): boolean => {
    const current = phaseRef.current;
    if (current === next) {
      if (nextRide !== undefined) setRide(nextRide);
      return true;
    }
    if (!(VALID_TRANSITIONS[current] || []).includes(next)) {
      console.warn(`[useDriverRideState] transition invalide ${current} → ${next}`);
      return false;
    }
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    phaseRef.current = next;
    setPhase(next);
    if (nextRide !== undefined) setRide(nextRide);
    // Relâche le verrou une fois l'état appliqué (pas de délai artificiel)
    Promise.resolve().then(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    });
    return true;
  }, []);

  // Charge la course active en interrogeant les deux tables en parallèle
  const loadActive = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;

    const [taxiRes, deliveryRes] = await Promise.all([
      supabase
        .from('transport_bookings')
        .select('*')
        .eq('driver_id', u.id)
        .in('status', TAXI_ACTIVE)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', u.id)
        .in('status', DELIVERY_ACTIVE)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const taxi = taxiRes.data?.[0];
    const delivery = deliveryRes.data?.[0];
    const active: ActiveRide | null = taxi
      ? { id: taxi.id, type: 'taxi', status: taxi.status, raw: taxi }
      : delivery
        ? { id: delivery.id, type: 'delivery', status: delivery.status, raw: delivery }
        : null;

    if (isTransitioningRef.current) return;

    if (active) {
      // Enrichir avec photo client depuis profiles
      let enriched: any = active;
      if (active.raw?.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name,avatar_url,phone_number')
          .eq('user_id', active.raw.user_id)
          .maybeSingle();
        if (prof) {
          enriched = {
            ...active,
            raw: {
              ...active.raw,
              customer_name: (prof as any).display_name || active.raw.customer_name,
              customer_avatar: (prof as any).avatar_url || null,
              customer_phone: (prof as any).phone_number || active.raw.customer_phone,
            }
          };
        }
      }
      syncPhase(STATUS_TO_PHASE[enriched.status] ?? 'ACCEPTED', enriched);
    } else if (!TERMINAL.includes(phaseRef.current) && phaseRef.current !== 'IDLE') {
      // Plus de course active et on n'est pas dans un état terminal → retour IDLE
      syncPhase('IDLE', null);
    }
  }, [syncPhase]);

  // Réinitialise la machine (après affichage d'un état terminal par ex.)
  const reset = useCallback(() => {
    isTransitioningRef.current = false;
    setIsTransitioning(false);
    setRide(null);
    setPhase('IDLE');
  }, []);

  // Un seul channel Realtime sur les deux tables, filtré client-side par driver_id
  useEffect(() => {
    if (!user) return;

    const handleRow = (row: any, type: 'taxi' | 'delivery') => {
      if (!row?.id || row.driver_id !== user.id) return;
      if (isTransitioningRef.current) return;
      const nextPhase = STATUS_TO_PHASE[row.status];
      if (!nextPhase) return;
      syncPhase(nextPhase, { id: row.id, type, status: row.status, raw: row });
    };

    const channel = supabase
      .channel(`driver-ride-state-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transport_bookings' },
        (payload) => handleRow(payload.new, 'taxi')
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'delivery_orders' },
        (payload) => handleRow(payload.new, 'delivery')
      )
      .subscribe();

    // Polling: 2s quand course active, 8s sinon
    const poll = setInterval(() => {
      const isActive = !['IDLE', 'COMPLETED', 'CANCELLED'].includes(phaseRef.current);
      if (isActive) loadActive();
    }, 2000);
    
    const pollIdle = setInterval(() => {
      const isIdle = ['IDLE', 'COMPLETED', 'CANCELLED'].includes(phaseRef.current);
      if (isIdle) loadActive();
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(pollIdle);
    };
  }, [user, syncPhase, loadActive]);

  // Polling de secours toutes les 15s — uniquement dans les phases "au repos"
  useEffect(() => {
    if (!['IDLE', 'COMPLETED', 'CANCELLED'].includes(phase)) return;
    const interval = setInterval(() => { loadActive(); }, 15000);
    return () => clearInterval(interval);
  }, [phase, loadActive]);

  // Chargement initial
  useEffect(() => {
    if (user) loadActive();
  }, [user, loadActive]);

  return {
    phase,
    ride,
    isTransitioning,
    transition,
    loadActive,
    reset,
  };
};
