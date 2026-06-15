/**
 * 🎯 PHASE 6: REALTIME OPTIMIZATION
 * 
 * Hook optimisé pour gérer les connexions realtime Supabase
 * avec pooling, reconnexion automatique et nettoyage intelligent
 * 
 * Features:
 * - Connection pooling (limite le nombre de channels simultanés)
 * - Auto-reconnexion avec exponential backoff
 * - Nettoyage automatique des channels inactifs
 * - Monitoring des statistiques de connexion
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseOptimizedRealtimeOptions {
  channelName: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table: string;
  filter?: string;
  onPayload: (payload: any) => void;
  enablePooling?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface ChannelStats {
  activeChannels: number;
  totalReconnections: number;
  lastError: string | null;
  isConnected: boolean;
}

// Pool global de channels pour éviter les duplicatas
const channelPool = new Map<string, RealtimeChannel>();
const channelSubscribers = new Map<string, number>();
const channelStats: ChannelStats = {
  activeChannels: 0,
  totalReconnections: 0,
  lastError: null,
  isConnected: true,
};

export const useOptimizedRealtime = ({
  channelName,
  event,
  schema = 'public',
  table,
  filter,
  onPayload,
  enablePooling = true,
  maxRetries = 5,
  retryDelay = 1000,
}: UseOptimizedRealtimeOptions) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const retriesRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clé unique pour le channel
  const channelKey = enablePooling
    ? `${table}-${event}-${filter || 'all'}`
    : `${channelName}-${Date.now()}`;

  // ============================================
  // CONNEXION AVEC POOLING
  // ============================================

  const connectWithPooling = useCallback(() => {
    // Vérifier si un channel existe déjà dans le pool
    let channel = channelPool.get(channelKey);

    if (!channel) {
      // Créer un nouveau channel
      channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            filter,
          } as any,
          onPayload
        );

      // Ajouter au pool
      channelPool.set(channelKey, channel);
      channelSubscribers.set(channelKey, 1);

      // Souscrire
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          channelStats.isConnected = true;
          channelStats.activeChannels = channelPool.size;
          retriesRef.current = 0;
          console.log(`✅ [Realtime] Connected to ${channelKey}`);
        } else if (status === 'CHANNEL_ERROR') {
          handleError('Channel error');
        } else if (status === 'TIMED_OUT') {
          handleError('Connection timeout');
        }
      });
    } else {
      // Réutiliser le channel existant
      const currentSubs = channelSubscribers.get(channelKey) || 0;
      channelSubscribers.set(channelKey, currentSubs + 1);
      
      // Ajouter le listener
      channel.on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        } as any,
        onPayload
      );

      setStatus('connected');
      console.log(`♻️ [Realtime] Reusing channel ${channelKey} (${currentSubs + 1} subscribers)`);
    }

    channelRef.current = channel;
  }, [channelKey, event, schema, table, filter, onPayload]);

  // ============================================
  // GESTION DES ERREURS AVEC BACKOFF
  // ============================================

  const handleError = useCallback((error: string) => {
    console.error(`❌ [Realtime] ${error} on ${channelKey}`);
    channelStats.lastError = error;
    channelStats.isConnected = false;
    setStatus('error');

    if (retriesRef.current < maxRetries) {
      const delay = retryDelay * Math.pow(2, retriesRef.current); // Exponential backoff
      retriesRef.current++;
      channelStats.totalReconnections++;

      console.log(`🔄 [Realtime] Retry ${retriesRef.current}/${maxRetries} in ${delay}ms`);

      timeoutRef.current = setTimeout(() => {
        connectWithPooling();
      }, delay);
    } else {
      console.error(`⚠️ [Realtime] Max retries reached for ${channelKey}`);
    }
  }, [channelKey, maxRetries, retryDelay, connectWithPooling]);

  // ============================================
  // CONNEXION INITIALE
  // ============================================

  useEffect(() => {
    connectWithPooling();

    return () => {
      // Nettoyer le timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Décrémenter les subscribers
      const currentSubs = channelSubscribers.get(channelKey) || 1;
      if (currentSubs <= 1) {
        // Dernier subscriber, supprimer le channel
        const channel = channelPool.get(channelKey);
        if (channel) {
          supabase.removeChannel(channel);
          channelPool.delete(channelKey);
          channelSubscribers.delete(channelKey);
          channelStats.activeChannels = channelPool.size;
          console.log(`🗑️ [Realtime] Removed channel ${channelKey}`);
        }
      } else {
        // Décrémenter seulement
        channelSubscribers.set(channelKey, currentSubs - 1);
        console.log(`📉 [Realtime] Decremented subscribers for ${channelKey}: ${currentSubs - 1}`);
      }
    };
  }, [channelKey, connectWithPooling]);

  // ============================================
  // MÉTHODES PUBLIQUES
  // ============================================

  const reconnect = useCallback(() => {
    retriesRef.current = 0;
    connectWithPooling();
  }, [connectWithPooling]);

  const getStats = useCallback(() => ({
    ...channelStats,
    currentChannel: channelKey,
    retries: retriesRef.current,
  }), [channelKey]);

  return {
    status,
    reconnect,
    getStats,
    isConnected: status === 'connected',
  };
};

/**
 * 🎯 Hook simplifié pour écouter une table
 */
export const useRealtimeTable = (
  table: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) => {
  const insertStatus = useOptimizedRealtime({
    channelName: `${table}-inserts`,
    event: 'INSERT',
    table,
    onPayload: onInsert || (() => {}),
    enablePooling: true,
  });

  const updateStatus = useOptimizedRealtime({
    channelName: `${table}-updates`,
    event: 'UPDATE',
    table,
    onPayload: onUpdate || (() => {}),
    enablePooling: true,
  });

  const deleteStatus = useOptimizedRealtime({
    channelName: `${table}-deletes`,
    event: 'DELETE',
    table,
    onPayload: onDelete || (() => {}),
    enablePooling: true,
  });

  return {
    insertStatus,
    updateStatus,
    deleteStatus,
    isConnected: insertStatus.isConnected && updateStatus.isConnected && deleteStatus.isConnected,
  };
};

/**
 * 🎯 Monitoring des stats globales
 */
export const useRealtimeStats = () => {
  const [stats, setStats] = useState(channelStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...channelStats });
    }, 5000); // Update toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return stats;
};
