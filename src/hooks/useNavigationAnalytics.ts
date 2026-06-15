/**
 * 📊 Hook React pour utiliser le service d'analytics de navigation
 */

import { useState, useCallback } from 'react';
import { navigationAnalytics, NavigationSession, NavigationEvent } from '@/services/navigationAnalytics';

export const useNavigationAnalytics = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  /**
   * Démarre une session de tracking
   */
  const startTracking = useCallback(async (sessionData: NavigationSession) => {
    setIsTracking(true);
    const sessionId = await navigationAnalytics.startSession(sessionData);
    
    if (sessionId) {
      setCurrentSessionId(sessionId);
      console.log('🎯 Tracking started for session:', sessionId);
      return sessionId;
    } else {
      setIsTracking(false);
      console.error('❌ Failed to start tracking');
      return null;
    }
  }, []);

  /**
   * Log un événement
   */
  const trackEvent = useCallback(async (
    event_type: NavigationEvent['event_type'],
    event_data?: any,
    location_coords?: { lat: number; lng: number }
  ) => {
    if (!currentSessionId) {
      console.warn('No active session to track event');
      return;
    }

    await navigationAnalytics.logEvent({
      session_id: currentSessionId,
      event_type,
      event_data,
      location_coords
    });
  }, [currentSessionId]);

  /**
   * Track hors-route
   */
  const trackOffRoute = useCallback(async (location: { lat: number; lng: number }) => {
    if (!currentSessionId) return;

    await navigationAnalytics.incrementCounter(currentSessionId, 'off_route_count');
    await trackEvent('off_route_detected', { timestamp: new Date().toISOString() }, location);
    console.log('⚠️ Off route detected');
  }, [currentSessionId, trackEvent]);

  /**
   * Track recalcul d'itinéraire
   */
  const trackRecalculation = useCallback(async (location: { lat: number; lng: number }) => {
    if (!currentSessionId) return;

    await navigationAnalytics.incrementCounter(currentSessionId, 'recalculations_count');
    await trackEvent('route_recalculated', { timestamp: new Date().toISOString() }, location);
    console.log('🔄 Route recalculated');
  }, [currentSessionId, trackEvent]);

  /**
   * Track instruction vocale
   */
  const trackVoiceInstruction = useCallback(async (instruction: string) => {
    if (!currentSessionId) return;

    await navigationAnalytics.incrementCounter(currentSessionId, 'voice_instructions_count');
    await trackEvent('voice_instruction', { instruction, timestamp: new Date().toISOString() });
    console.log('🔊 Voice instruction:', instruction);
  }, [currentSessionId, trackEvent]);

  /**
   * Track arrivée
   */
  const trackArrival = useCallback(async (location: { lat: number; lng: number }) => {
    if (!currentSessionId) return;

    await trackEvent('arrived_at_destination', { timestamp: new Date().toISOString() }, location);
    console.log('🎯 Arrived at destination');
  }, [currentSessionId, trackEvent]);

  /**
   * Termine le tracking
   */
  const endTracking = useCallback(async (
    status: 'completed' | 'cancelled' | 'error',
    completionStatus?: 'arrived' | 'cancelled_by_driver' | 'cancelled_by_customer' | 'error',
    actualDurationMinutes?: number
  ) => {
    if (!currentSessionId) {
      console.warn('No active session to end');
      return;
    }

    await navigationAnalytics.endSession(currentSessionId, status, completionStatus, actualDurationMinutes);
    setCurrentSessionId(null);
    setIsTracking(false);
    console.log('🏁 Tracking ended');
  }, [currentSessionId]);

  /**
   * Log une erreur
   */
  const trackError = useCallback(async (errorType: string, errorMessage: string, errorData?: any) => {
    if (!currentSessionId) return;

    await navigationAnalytics.logError(currentSessionId, errorType, errorMessage, errorData);
    console.error('❌ Navigation error tracked:', errorType);
  }, [currentSessionId]);

  return {
    // État
    currentSessionId,
    isTracking,

    // Actions
    startTracking,
    endTracking,
    trackEvent,
    trackOffRoute,
    trackRecalculation,
    trackVoiceInstruction,
    trackArrival,
    trackError
  };
};
