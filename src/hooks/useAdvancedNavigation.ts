import { useState, useEffect, useCallback, useRef } from 'react';
import { DirectionsService } from '@/services/directionsService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';
import { useToast } from '@/hooks/use-toast';
import type {
  TripData,
  NavigationRoute,
  NavigationState,
  TripLocation
} from '@/types/navigation';

type LatLng = { lat: number; lng: number };

function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export const useAdvancedNavigation = (trip: TripData) => {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isActive: false,
    currentStep: 0,
    remainingDistance: 0,
    remainingDuration: 0,
    offRoute: false,
    recalculating: false
  });
  
  const [currentDestination, setCurrentDestination] = useState<TripLocation>(trip.pickup);
  const [hasPickedUp, setHasPickedUp] = useState(trip.status !== 'accepted');
  
  const geolocation = useGeolocation();
  const { speakInstruction, formatNavigationInstruction } = useVoiceNavigation();
  const { toast } = useToast();
  
  const lastAnnouncedStep = useRef<number>(-1);
  const recalculationTimer = useRef<NodeJS.Timeout | null>(null);
  const lastApiT = useRef<number>(0);
  const lastApiPos = useRef<LatLng | null>(null);

  // Calculate initial route
  useEffect(() => { if (currentDestination) calculateRoute(); }, [currentDestination]);

  // Throttled GPS-driven recalc: ≥150m moved AND ≥10s since last API call, only while navigating
  useEffect(() => {
    if (!geolocation.latitude || !geolocation.longitude || !navigationState.isActive) return;
    const pos = { lat: geolocation.latitude, lng: geolocation.longitude }, now = Date.now();
    if ((!lastApiPos.current || haversineM(lastApiPos.current, pos) > 150) && now - lastApiT.current > 10000) {
      lastApiT.current = now;
      lastApiPos.current = pos;
      console.log('[Directions] GPS deviation');
      calculateRoute();
    }
  }, [geolocation.latitude, geolocation.longitude]);

  // Monitor navigation progress
  useEffect(() => {
    if (navigationState.isActive && route && geolocation.latitude && geolocation.longitude) {
      updateNavigationProgress();
    }
  }, [geolocation.latitude, geolocation.longitude, navigationState.isActive, route]);

  const calculateRoute = useCallback(async () => {
    if (!geolocation.latitude || !geolocation.longitude) return;

    try {
      setNavigationState(prev => ({ ...prev, recalculating: true }));
      
      const origin = {
        lat: geolocation.latitude,
        lng: geolocation.longitude
      };

      const routeData = await DirectionsService.getDirections(
        origin,
        currentDestination,
        { 
          profile: 'driving-traffic',
          steps: true,
          alternatives: false
        }
      );

      setRoute(routeData);
      setNavigationState(prev => ({
        ...prev,
        remainingDistance: routeData.distance,
        remainingDuration: routeData.duration,
        recalculating: false,
        offRoute: false
      }));

      if (navigationState.isActive) {
        await speakInstruction(`Nouvel itinéraire calculé. ${routeData.distanceText}, ${routeData.durationText}`);
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
      setNavigationState(prev => ({ ...prev, recalculating: false }));
      toast({
        title: "Erreur de navigation",
        description: "Impossible de calculer l'itinéraire",
        variant: "destructive"
      });
    }
  }, [geolocation.latitude, geolocation.longitude, currentDestination, navigationState.isActive, speakInstruction, toast]);

  const updateNavigationProgress = useCallback(() => {
    if (!route || !geolocation.latitude || !geolocation.longitude) return;

    const currentLocation = { lat: geolocation.latitude, lng: geolocation.longitude };
    
    // Find current step based on location
    let closestStep = 0;
    let minDistance = Infinity;
    
    route.steps.forEach((step, index) => {
      const stepStart = step.coordinates[0];
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        stepStart[1],
        stepStart[0]
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestStep = index;
      }
    });

    // Check if off route (more than 50m from any step)
    const isOffRoute = minDistance > 0.05; // 50 meters
    
    if (isOffRoute && !navigationState.recalculating) {
      setNavigationState(prev => ({ ...prev, offRoute: true }));
      
      // Debounced recalculation
      if (recalculationTimer.current) {
        clearTimeout(recalculationTimer.current);
      }
      
      recalculationTimer.current = setTimeout(() => {
        if (Date.now() - lastApiT.current < 10000) return;
        lastApiT.current = Date.now();
        if (geolocation.latitude && geolocation.longitude) {
          lastApiPos.current = { lat: geolocation.latitude, lng: geolocation.longitude };
        }
        console.log('[Directions] GPS deviation');
        calculateRoute();
        speakInstruction("Recalcul de l'itinéraire en cours");
      }, 3000);
      
      return;
    }

    // Update navigation state
    setNavigationState(prev => ({
      ...prev,
      currentStep: closestStep,
      currentLocation,
      offRoute: false
    }));

    // Voice announcements for new steps
    if (closestStep !== lastAnnouncedStep.current && closestStep < route.steps.length) {
      const currentStep = route.steps[closestStep];
      const nextStep = route.steps[closestStep + 1];
      
      if (nextStep) {
        const instruction = formatNavigationInstruction(
          nextStep.maneuver || 'straight',
          nextStep.distance,
          nextStep.streetName
        );
        
        speakInstruction(instruction);
      }
      
      lastAnnouncedStep.current = closestStep;
    }

    // Check arrival
    const distanceToDestination = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      currentDestination.lat,
      currentDestination.lng
    );

    if (distanceToDestination < 0.1) { // 100 meters
      handleArrival();
    }
  }, [route, geolocation.latitude, geolocation.longitude, navigationState.recalculating, currentDestination, formatNavigationInstruction, speakInstruction, calculateRoute]);

  const handleArrival = useCallback(async () => {
    if (!hasPickedUp) {
      // Arrived at pickup
      await speakInstruction("Vous êtes arrivé au point de collecte");
      setHasPickedUp(true);
      setCurrentDestination(trip.destination);
      
      toast({
        title: "Point de collecte atteint",
        description: "Confirmez la prise en charge du client/colis",
      });
    } else {
      // Arrived at destination
      await speakInstruction("Vous êtes arrivé à destination");
      stopNavigation();
      
      toast({
        title: "Destination atteinte",
        description: "Course terminée avec succès",
      });
    }
  }, [hasPickedUp, trip.destination, speakInstruction, toast]);

  const startNavigation = useCallback(async () => {
    setNavigationState(prev => ({ ...prev, isActive: true }));
    
    const initialInstruction = hasPickedUp 
      ? "Navigation vers la destination démarrée"
      : "Navigation vers le point de collecte démarrée";
      
    await speakInstruction(initialInstruction);
    
    toast({
      title: "Navigation démarrée",
      description: "Suivez les instructions vocales",
    });
  }, [hasPickedUp, speakInstruction, toast]);

  const stopNavigation = useCallback(() => {
    setNavigationState(prev => ({ ...prev, isActive: false }));
    
    if (recalculationTimer.current) {
      clearTimeout(recalculationTimer.current);
      recalculationTimer.current = null;
    }
    
    toast({
      title: "Navigation arrêtée",
      description: "Vous pouvez reprendre à tout moment",
    });
  }, [toast]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const confirmPickup = useCallback(() => {
    setHasPickedUp(true);
    setCurrentDestination(trip.destination);
    lastAnnouncedStep.current = -1; // Reset step tracking
  }, [trip.destination]);

  const skipToDestination = useCallback(() => {
    setCurrentDestination(trip.destination);
    setHasPickedUp(true);
    lastAnnouncedStep.current = -1;
  }, [trip.destination]);

  return {
    route,
    navigationState,
    currentDestination,
    hasPickedUp,
    startNavigation,
    stopNavigation,
    confirmPickup,
    skipToDestination,
    calculateRoute
  };
};