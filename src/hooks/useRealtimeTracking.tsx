import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TrackingData {
  userId: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface UseRealtimeTrackingOptions {
  trackingId?: string;
  userType: 'client' | 'driver';
  enabled?: boolean;
}

export const useRealtimeTracking = ({ trackingId, userType, enabled = true }: UseRealtimeTrackingOptions) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize real-time channel
  useEffect(() => {
    if (!enabled || !user || !trackingId) return;

    const channel = supabase.channel(`tracking_${trackingId}`);
    channelRef.current = channel;

    // Subscribe to tracking updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Tracking sync:', newState);
        setConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Driver joined tracking:', key, newPresences);
        if (newPresences.length > 0) {
          const presenceData = newPresences[0] as any;
          if (presenceData && typeof presenceData === 'object') {
            setTrackingData(presenceData as TrackingData);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Driver left tracking:', key, leftPresences);
        if (userType === 'client') {
          toast({
            title: "Chauffeur déconnecté",
            description: "Le suivi en temps réel a été interrompu",
            variant: "destructive",
          });
        }
      })
      .on('broadcast', { event: 'location_update' }, (payload) => {
        console.log('Location update received:', payload);
        setTrackingData(payload.data as TrackingData);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          console.log('Connected to tracking channel');
        } else if (status === 'CHANNEL_ERROR') {
          setConnected(false);
          console.error('Failed to connect to tracking channel');
        }
      });

    return () => {
      channel.unsubscribe();
      setConnected(false);
    };
  }, [enabled, user, trackingId, userType, toast]);

  // Start tracking for drivers
  const startTracking = async (initialLocation: { latitude: number; longitude: number }) => {
    if (!user || !trackingId || userType !== 'driver') return;

    try {
      setIsTracking(true);
      
      const trackingData: TrackingData = {
        userId: user.id,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        status: 'available',
        timestamp: new Date().toISOString(),
      };

      // Track presence
      await channelRef.current?.track(trackingData);
      
      setTrackingData(trackingData);
      
      toast({
        title: "Tracking activé",
        description: "Votre position est maintenant partagée en temps réel",
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
      setIsTracking(false);
      toast({
        title: "Erreur de tracking",
        description: "Impossible d'activer le suivi en temps réel",
        variant: "destructive",
      });
    }
  };

  // Update location for drivers
  const updateLocation = async (location: { 
    latitude: number; 
    longitude: number; 
    heading?: number; 
    speed?: number;
  }) => {
    if (!user || !trackingId || userType !== 'driver' || !isTracking) return;

    try {
      const updatedData: TrackingData = {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        status: trackingData?.status || 'available',
        heading: location.heading,
        speed: location.speed,
        timestamp: new Date().toISOString(),
      };

      // Broadcast location update
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'location_update',
        data: updatedData,
      });

      setTrackingData(updatedData);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Update status for drivers
  const updateStatus = async (status: TrackingData['status']) => {
    if (!user || !trackingId || userType !== 'driver' || !trackingData) return;

    try {
      const updatedData: TrackingData = {
        ...trackingData,
        status,
        timestamp: new Date().toISOString(),
      };

      await channelRef.current?.track(updatedData);
      setTrackingData(updatedData);
      
      toast({
        title: "Statut mis à jour",
        description: `Statut changé vers: ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    if (!channelRef.current) return;

    try {
      await channelRef.current.untrack();
      setIsTracking(false);
      setTrackingData(null);
      
      toast({
        title: "Tracking désactivé",
        description: "Votre position n'est plus partagée",
      });
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  // Calculate ETA based on distance and speed
  const calculateETA = (distance: number, averageSpeed: number = 30): number => {
    // distance in km, speed in km/h, returns minutes
    return Math.round((distance / averageSpeed) * 60);
  };

  // Get distance to destination
  const getDistanceToDestination = (destination: { latitude: number; longitude: number }): number | null => {
    if (!trackingData) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (destination.latitude - trackingData.latitude) * Math.PI / 180;
    const dLon = (destination.longitude - trackingData.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(trackingData.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return {
    trackingData,
    isTracking,
    connected,
    startTracking,
    updateLocation,
    updateStatus,
    stopTracking,
    calculateETA,
    getDistanceToDestination,
  };
};