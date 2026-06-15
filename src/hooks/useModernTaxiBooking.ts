/**
 * 🚗 HOOK DE RÉSERVATION TAXI MODERNE
 * Logique robuste avec retry automatique et validation avancée
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { LocationData } from '@/types/location';
import { cityDetectionService } from '@/services/cityDetectionService';

// Interface compatible avec l'ancien UltimateLocationData
interface UltimateLocationData {
  address: string;
  lat: number;
  lng: number;
  accuracy: number;
  confidence: number;
  source: string;
  timestamp: number;
  type: 'precise' | 'approximate' | 'fallback';
  placeId?: string;
  name?: string;
}

interface ModernBookingData {
  pickup: UltimateLocationData;
  destination: UltimateLocationData;
  vehicleType: string;
  passengers?: number;
  estimatedPrice: number;
  distance?: number;
  notes?: string;
  scheduledTime?: Date;
  city?: string; // Ville de la réservation
}

interface BookingResult {
  id: string;
  status: 'pending' | 'confirmed' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
  driverAssigned?: {
    driverId: string;
    estimatedArrival: number;
    driverInfo: any;
  };
}

interface UseModernTaxiBookingState {
  isCreatingBooking: boolean;
  isSearchingDriver: boolean;
  lastBooking: BookingResult | null;
  error: string | null;
}

export function useModernTaxiBooking() {
  const { user } = useAuth();
  const [state, setState] = useState<UseModernTaxiBookingState>({
    isCreatingBooking: false,
    isSearchingDriver: false,
    lastBooking: null,
    error: null
  });

  /**
   * 🔧 Valider et corriger les coordonnées automatiquement
   */
  const validateAndCorrectCoordinates = async (
    pickup: UltimateLocationData, 
    destination: UltimateLocationData
  ): Promise<{ pickup: any; destination: any }> => {
    try {
      console.log('🔍 [ModernTaxi] Validation coordonnées...');
      
      const { data, error } = await supabase.rpc('validate_booking_coordinates', {
        pickup_coords: {
          lat: pickup.lat,
          lng: pickup.lng,
          address: pickup.address
        },
        delivery_coords: {
          lat: destination.lat,
          lng: destination.lng,
          address: destination.address
        }
      });

      if (error) {
        console.warn('⚠️ [ModernTaxi] Erreur validation RPC, utilisation coordonnées originales:', error);
        // Utiliser les coordonnées originales si RPC échoue
        return {
          pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
          destination: { lat: destination.lat, lng: destination.lng, address: destination.address }
        };
      }

      console.log('✅ [ModernTaxi] Coordonnées validées:', data);
      
      // Extraire les coordonnées validées ou utiliser les originales
      const result = data as any;
      const validatedPickup = result?.data?.pickup || { 
        lat: pickup.lat, 
        lng: pickup.lng, 
        address: pickup.address 
      };
      
      const validatedDestination = result?.data?.delivery || { 
        lat: destination.lat, 
        lng: destination.lng, 
        address: destination.address 
      };

      return {
        pickup: validatedPickup,
        destination: validatedDestination
      };

    } catch (error) {
      console.warn('⚠️ [ModernTaxi] Erreur validation, utilisation coordonnées originales:', error);
      return {
        pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
        destination: { lat: destination.lat, lng: destination.lng, address: destination.address }
      };
    }
  };

  /**
   * 🚗 Créer une réservation avec logique de retry robuste
   */
  const createBooking = useCallback(async (
    bookingData: ModernBookingData
  ): Promise<BookingResult | null> => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isCreatingBooking: true, 
      error: null 
    }));

    try {
      console.log('🚗 [ModernTaxi] Création réservation démarrée...');

      // 1. Validation et correction des coordonnées
      const { pickup: validatedPickup, destination: validatedDestination } = 
        await validateAndCorrectCoordinates(bookingData.pickup, bookingData.destination);

      // 2. Détecter intelligemment la ville
      const cityDetection = cityDetectionService.detectCity({
        coordinates: validatedPickup,
        address: bookingData.pickup.address,
        userSelection: bookingData.city
      });

      console.log('🏙️ [ModernTaxi] Ville détectée:', cityDetection.city.name, 'Confiance:', cityDetection.confidence);

      // 3. Préparer les données de réservation avec ville détectée
      const bookingPayload = {
        user_id: user.id,
        pickup_location: bookingData.pickup.address,
        pickup_coordinates: validatedPickup,
        destination: bookingData.destination.address,
        destination_coordinates: validatedDestination,
        vehicle_type: bookingData.vehicleType,
        estimated_price: Math.round(bookingData.estimatedPrice),
        total_distance: bookingData.distance,
        notes: bookingData.notes || null,
        pickup_time: bookingData.scheduledTime?.toISOString() || new Date().toISOString(),
        city: cityDetection.city.name, // Ville détectée intelligemment
        status: 'pending'
      };

      console.log('📝 [ModernTaxi] Données préparées:', {
        pickup: validatedPickup,
        destination: validatedDestination,
        vehicle: bookingData.vehicleType,
        price: bookingData.estimatedPrice
      });

      // 3. Créer la réservation avec retry
      let booking: any;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const { data, error } = await supabase
            .from('transport_bookings')
            .insert(bookingPayload)
            .select()
            .single();

          if (error) throw error;
          
          booking = data;
          console.log(`✅ [ModernTaxi] Réservation créée (tentative ${attempts}):`, booking.id);
          break;

        } catch (insertError: any) {
          console.warn(`❌ [ModernTaxi] Échec tentative ${attempts}:`, insertError);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Échec création après ${maxAttempts} tentatives: ${insertError.message}`);
          }
          
          // Attendre avant retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // 4. Déclencher la recherche de chauffeur
      toast.success('Réservation créée ! Recherche de chauffeur...');
      
      setState(prev => ({ 
        ...prev, 
        lastBooking: { id: booking.id, status: 'pending' }
      }));

      // 5. Lancer dispatch en arrière-plan
      const driverResult = await dispatchDriver(booking.id, validatedPickup);
      
      const finalResult: BookingResult = {
        id: booking.id,
        status: driverResult.success ? 'driver_assigned' : 'pending',
        driverAssigned: driverResult.success ? driverResult.driver : undefined
      };

      setState(prev => ({ 
        ...prev, 
        lastBooking: finalResult,
        isCreatingBooking: false 
      }));

      return finalResult;

    } catch (error: any) {
      console.error('❌ [ModernTaxi] Erreur création réservation:', error);
      
      setState(prev => ({ 
        ...prev, 
        isCreatingBooking: false,
        error: error.message || 'Erreur lors de la réservation'
      }));

      toast.error(error.message || 'Impossible de créer la réservation');
      return null;
    }
  }, [user]);

  /**
   * 🔍 Dispatcher un chauffeur avec Edge Function améliorée
   */
  const dispatchDriver = async (
    bookingId: string, 
    pickupCoords: { lat: number; lng: number }
  ): Promise<{ success: boolean; driver?: any; message?: string }> => {
    setState(prev => ({ ...prev, isSearchingDriver: true }));

    try {
      console.log('🔍 [ModernTaxi] Recherche chauffeur pour:', bookingId);

      // Utiliser la nouvelle Edge Function ride-dispatcher avec retry
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
            body: {
              bookingId: bookingId,
              pickupLat: pickupCoords.lat,
              pickupLng: pickupCoords.lng,
              serviceType: 'taxi',
              vehicleClass: 'standard',
              priority: 'normal'
            }
          });

          if (error) throw error;

          console.log(`✅ [ModernTaxi] Résultat dispatch (tentative ${attempts}):`, data);

          if (data?.success && data?.driver) {
            toast.success(`Chauffeur trouvé ! Arrivée estimée: ${data.driver.estimated_arrival_minutes || 'N/A'} min`);
            
            return {
              success: true,
              driver: {
                driverId: data.driver.driver_id,
                estimatedArrival: data.driver.estimated_arrival_minutes || 10,
                driverInfo: data.driver
              }
            };
          } else {
            const message = data?.message || 'Aucun chauffeur disponible';
            console.warn(`⚠️ [ModernTaxi] Pas de chauffeur (tentative ${attempts}):`, message);
            
            if (attempts >= maxAttempts) {
              toast.error(message);
              return { success: false, message };
            }
          }

        } catch (dispatchError: any) {
          console.warn(`❌ [ModernTaxi] Erreur dispatch tentative ${attempts}:`, dispatchError);
          
          if (attempts >= maxAttempts) {
            toast.error('Erreur recherche chauffeur');
            return { success: false, message: dispatchError.message };
          }
        }

        // Attendre avant retry avec backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }

      return { success: false, message: 'Aucun chauffeur trouvé après plusieurs tentatives' };

    } catch (error: any) {
      console.error('❌ [ModernTaxi] Erreur générale dispatch:', error);
      toast.error('Erreur lors de la recherche de chauffeurs');
      return { success: false, message: error.message };
      
    } finally {
      setState(prev => ({ ...prev, isSearchingDriver: false }));
    }
  };

  /**
   * 📋 Récupérer les réservations utilisateur
   */
  const getUserBookings = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: bookings, error } = await supabase
        .from('transport_bookings')
        .select(`
          *,
          driver_profiles!transport_bookings_driver_id_fkey (
            user_id,
            vehicle_make,
            vehicle_model,
            vehicle_plate,
            rating_average,
            rating_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return bookings || [];

    } catch (error: any) {
      console.error('❌ [ModernTaxi] Erreur récupération réservations:', error);
      return [];
    }
  }, [user]);

  /**
   * ❌ Annuler une réservation
   */
  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Réservation annulée');
      return true;

    } catch (error: any) {
      console.error('❌ [ModernTaxi] Erreur annulation:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  }, [user]);

  return {
    // État
    isCreatingBooking: state.isCreatingBooking,
    isSearchingDriver: state.isSearchingDriver,
    lastBooking: state.lastBooking,
    error: state.error,
    
    // Actions
    createBooking,
    getUserBookings,
    cancelBooking,
    
    // Utils
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}

export default useModernTaxiBooking;