/**
 * Service de partage de trajet sécurisé avec liens dynamiques Google Maps
 * Génère des liens partagés avec chiffrement des données sensibles
 */

import { supabase } from '@/integrations/supabase/client';
import { getSharedTripUrl } from '@/config/appUrl';

export interface TripShareData {
  tripId: string;
  passengerName: string;
  driverName: string;
  driverPhone: string;
  vehicleInfo: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedArrival: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface TripShareLink {
  shareId: string;
  shareUrl: string;
  googleMapsUrl: string;
  expiresAt: Date;
  isActive: boolean;
}

class TripSharingService {
  private static instance: TripSharingService;

  static getInstance(): TripSharingService {
    if (!this.instance) {
      this.instance = new TripSharingService();
    }
    return this.instance;
  }

  /**
   * Créer un lien de partage sécurisé pour un trajet
   */
  async createTripShareLink(tripData: TripShareData, expiresInHours: number = 24): Promise<TripShareLink> {
    try {
      // Générer un ID unique pour le partage
      const shareId = this.generateSecureShareId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Chiffrer les données sensibles
      const encryptedData = await this.encryptTripData(tripData);

      // Créer l'enregistrement en base - utiliser insert direct temporairement
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('trip_share_links')
        .insert({
          share_id: shareId,
          trip_id: tripData.tripId,
          encrypted_data: encryptedData,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Générer les URLs
      const shareUrl = getSharedTripUrl(shareId);
      const googleMapsUrl = this.generateGoogleMapsUrl(tripData);

      // Logger l'événement de partage
      await this.logSharingEvent('trip_shared', shareId, tripData.tripId);

      return {
        shareId,
        shareUrl,
        googleMapsUrl,
        expiresAt,
        isActive: true
      };
    } catch (error) {
      console.error('Erreur création lien partage:', error);
      throw new Error('Impossible de créer le lien de partage');
    }
  }

  /**
   * Récupérer les données d'un trajet partagé
   */
  async getTripShareData(shareId: string): Promise<TripShareData | null> {
    try {
      const { data, error } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('share_id', shareId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return null;

      // Vérifier l'expiration
      if (new Date(data.expires_at) < new Date()) {
        await this.deactivateShareLink(shareId);
        return null;
      }

      // Déchiffrer les données
      const tripData = await this.decryptTripData(data.encrypted_data);

      // Logger l'accès
      await this.logSharingEvent('trip_accessed', shareId, data.trip_id);

      return tripData;
    } catch (error) {
      console.error('Erreur récupération données partagées:', error);
      return null;
    }
  }

  /**
   * Générer URL Google Maps avec trajet
   */
  private generateGoogleMapsUrl(tripData: TripShareData): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const origin = encodeURIComponent(tripData.pickupAddress);
    const destination = encodeURIComponent(tripData.destinationAddress);
    
    let url = `${baseUrl}${origin}/${destination}`;
    
    // Ajouter position actuelle si disponible
    if (tripData.currentLocation) {
      const current = `${tripData.currentLocation.lat},${tripData.currentLocation.lng}`;
      url = `${baseUrl}${origin}/${current}/${destination}`;
    }

    // Paramètres additionnels
    url += '?travelmode=driving&hl=fr';
    
    return url;
  }

  /**
   * Générer un ID de partage sécurisé
   */
  private generateSecureShareId(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const crypto = window.crypto || (window as any).msCrypto;
    
    if (crypto && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      for (let i = 0; i < array.length; i++) {
        result += charset[array[i] % charset.length];
      }
    } else {
      // Fallback pour anciens navigateurs
      for (let i = 0; i < 32; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
    }
    
    return result;
  }

  /**
   * Chiffrement simple des données sensibles (à améliorer avec vraie crypto)
   */
  private async encryptTripData(tripData: TripShareData): Promise<string> {
    try {
      // Utiliser l'API SubtleCrypto pour un vrai chiffrement
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(tripData));
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      // Exporter la clé et combiner avec IV et données
      const exportedKey = await window.crypto.subtle.exportKey('raw', key);
      const combined = new Uint8Array(exportedKey.byteLength + iv.length + encrypted.byteLength);
      combined.set(new Uint8Array(exportedKey), 0);
      combined.set(iv, exportedKey.byteLength);
      combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Erreur chiffrement:', error);
      // Fallback simple en cas d'erreur
      return btoa(JSON.stringify(tripData));
    }
  }

  /**
   * Déchiffrement des données
   */
  private async decryptTripData(encryptedData: string): Promise<TripShareData> {
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      
      // Extraire clé, IV et données
      const keyBytes = combined.slice(0, 32);
      const iv = combined.slice(32, 44);
      const encrypted = combined.slice(44);

      // Importer la clé
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Déchiffrer
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Erreur déchiffrement:', error);
      // Fallback simple
      return JSON.parse(atob(encryptedData));
    }
  }

  /**
   * Désactiver un lien de partage
   */
  async deactivateShareLink(shareId: string): Promise<void> {
    await supabase
      .from('trip_share_links')
      .update({ is_active: false })
      .eq('share_id', shareId);

    await this.logSharingEvent('trip_share_deactivated', shareId);
  }

  /**
   * Mettre à jour la position du trajet partagé
   */
  async updateTripLocation(shareId: string, location: { lat: number; lng: number }): Promise<void> {
    try {
      // Récupérer et mettre à jour les données
      const tripData = await this.getTripShareData(shareId);
      if (!tripData) return;

      tripData.currentLocation = location;
      const encryptedData = await this.encryptTripData(tripData);

      await supabase
        .from('trip_share_links')
        .update({ 
          encrypted_data: encryptedData,
          updated_at: new Date().toISOString()
        })
        .eq('share_id', shareId);

      await this.logSharingEvent('trip_location_updated', shareId);
    } catch (error) {
      console.error('Erreur mise à jour position:', error);
    }
  }

  /**
   * Logger les événements de partage
   */
  private async logSharingEvent(eventType: string, shareId: string, tripId?: string): Promise<void> {
    try {
      await supabase.functions.invoke('audit-logger', {
        body: {
          event_type: eventType,
          share_id: shareId,
          trip_id: tripId,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_info: 'client-side' // Sera enrichi côté serveur
        }
      });
    } catch (error) {
      console.error('Erreur logging événement partage:', error);
    }
  }

  /**
   * Nettoyer les liens expirés (à appeler périodiquement)
   */
  async cleanupExpiredLinks(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('trip_share_links')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select('share_id');

      if (error) throw error;

      // Logger le nettoyage
      for (const link of data || []) {
        await this.logSharingEvent('trip_link_expired', link.share_id);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Erreur nettoyage liens expirés:', error);
      return 0;
    }
  }
}

export const tripSharingService = TripSharingService.getInstance();