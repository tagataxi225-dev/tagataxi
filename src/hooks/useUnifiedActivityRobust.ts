import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ActivityType = 'delivery' | 'marketplace_purchase' | 'marketplace_sale' | 'payment' | 'transport' | 'wallet_transfer';

export interface UnifiedActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  amount?: number;
  currency?: string;
  status?: string;
  timestamp: string;
  counterpartyName?: string;
  raw?: any;
}

interface ActivityCache {
  data: UnifiedActivityItem[];
  timestamp: number;
  expires: number;
}

// Cache simple en mémoire (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
let activityCache: ActivityCache | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useUnifiedActivityRobust = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UnifiedActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fonction de retry avec backoff exponentiel
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (i === maxRetries) throw err;
        
        // Backoff exponentiel: 1s, 2s, 4s
        const backoffTime = Math.pow(2, i) * 1000;
        console.log(`Tentative ${i + 1} échouée, retry dans ${backoffTime}ms:`, err.message);
        await delay(backoffTime);
      }
    }
  };

  // Fonction de fetch avec timeout et gestion d'erreurs robuste
  const fetchWithTimeout = async (query: any, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const result = await query;
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Timeout de connexion');
      }
      throw err;
    }
  };

  const fetchAllActivities = useCallback(async (useCache = true) => {
    if (!user) {
      setActivities([]);
      return;
    }

    // Vérifier le cache d'abord
    if (useCache && activityCache && Date.now() < activityCache.expires) {
      console.log('📦 Utilisation du cache des activités');
      setActivities(activityCache.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchData = async () => {
        const promises = [
          // Transport bookings
          fetchWithTimeout(
            supabase
              .from('transport_bookings')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(25)
          ),
          // Delivery orders
          fetchWithTimeout(
            supabase
              .from('delivery_orders')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(25)
          ),
          // Marketplace orders - as buyer
          fetchWithTimeout(
            supabase
              .from('marketplace_orders')
              .select('*')
              .eq('buyer_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(25)
          ),
          // Marketplace orders - as seller
          fetchWithTimeout(
            supabase
              .from('marketplace_orders')
              .select('*')
              .eq('seller_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(25)
          ),
          // Payment transactions
          fetchWithTimeout(
            supabase
              .from('wallet_transactions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(25)
          ),
          // Wallet transfers (in/out)
          fetchWithTimeout(
            supabase
              .from('wallet_transactions')
              .select('*')
              .eq('user_id', user.id)
              .in('transaction_type', ['transfer_in', 'transfer_out'])
              .order('created_at', { ascending: false })
              .limit(25)
          )
        ];

        return await Promise.allSettled(promises);
      };

      const results = await retryWithBackoff(fetchData);
      
      const [transportRes, deliveryRes, marketplaceBuyerRes, marketplaceSellerRes, paymentsRes, transfersRes] = results;

      const allItems: UnifiedActivityItem[] = [];

      // Transport bookings
      if (transportRes.status === 'fulfilled' && transportRes.value.data) {
        const transportItems = transportRes.value.data.map((t: any) => ({
          id: t.id,
          type: 'transport' as ActivityType,
          title: `${t.pickup_location || 'Départ'} → ${t.destination || 'Destination'}`,
          subtitle: `${t.status} • ${t.vehicle_type}`,
          amount: t.actual_price ?? t.estimated_price,
          currency: 'CDF',
          status: t.status,
          timestamp: t.updated_at || t.created_at,
          raw: t,
        }));
        allItems.push(...transportItems);
      }

      // Delivery orders
      if (deliveryRes.status === 'fulfilled' && deliveryRes.value.data) {
        const deliveryItems = deliveryRes.value.data.map((d: any) => ({
          id: d.id,
          type: 'delivery' as ActivityType,
          title: `${d.pickup_location || 'Départ'} → ${d.delivery_location || 'Destination'}`,
          subtitle: `${d.status} • ${d.delivery_type}`,
          amount: d.actual_price ?? d.estimated_price,
          currency: 'CDF',
          status: d.status,
          timestamp: d.updated_at || d.created_at,
          raw: d,
        }));
        allItems.push(...deliveryItems);
      }

      // Marketplace purchases
      if (marketplaceBuyerRes.status === 'fulfilled' && marketplaceBuyerRes.value.data) {
        const buyerItems = marketplaceBuyerRes.value.data.map((o: any) => ({
          id: o.id,
          type: 'marketplace_purchase' as ActivityType,
          title: `Achat #${String(o.id).slice(0, 6)}`,
          subtitle: `${o.status} • Paiement: ${o.payment_status}`,
          amount: o.total_amount ?? (o.unit_price * (o.quantity || 1)),
          currency: 'CDF',
          status: o.status,
          timestamp: o.updated_at || o.created_at,
          raw: o,
        }));
        allItems.push(...buyerItems);
      }

      // Marketplace sales
      if (marketplaceSellerRes.status === 'fulfilled' && marketplaceSellerRes.value.data) {
        const sellerItems = marketplaceSellerRes.value.data.map((o: any) => ({
          id: o.id,
          type: 'marketplace_sale' as ActivityType,
          title: `Vente #${String(o.id).slice(0, 6)}`,
          subtitle: `${o.status} • Livraison: ${o.delivery_method || 'pickup'}`,
          amount: o.total_amount ?? (o.unit_price * (o.quantity || 1)),
          currency: 'CDF',
          status: o.status,
          timestamp: o.updated_at || o.created_at,
          raw: o,
        }));
        allItems.push(...sellerItems);
      }

      // Payments (excluding transfers)
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
        const paymentItems = paymentsRes.value.data
          .filter((p: any) => !['transfer_in', 'transfer_out'].includes(p.transaction_type))
          .map((p: any) => ({
            id: p.id,
            type: 'payment' as ActivityType,
            title: `${p.transaction_type === 'credit' ? 'Reçu' : 'Envoyé'} ${p.amount ? Math.abs(p.amount).toLocaleString() : ''} ${p.currency || 'CDF'}`,
            subtitle: `${p.status} • ${p.description || p.payment_method || 'Wallet'}`,
            amount: Math.abs(p.amount || 0),
            currency: p.currency || 'CDF',
            status: p.status,
            timestamp: p.created_at,
            raw: p,
          }));
        allItems.push(...paymentItems);
      }

      // Wallet Transfers (in/out)
      if (transfersRes.status === 'fulfilled' && transfersRes.value.data) {
        const transferItems = transfersRes.value.data.map((t: any) => {
          const isReceived = t.transaction_type === 'transfer_in';
          const contactName = t.description?.includes('de ') 
            ? t.description.split('de ')[1]?.trim() || 'Contact'
            : t.description?.includes('à ')
              ? t.description.split('à ')[1]?.trim() || 'Contact'
              : 'Contact';
          
          return {
            id: t.id,
            type: 'wallet_transfer' as ActivityType,
            title: isReceived ? `Reçu de ${contactName}` : `Envoyé à ${contactName}`,
            subtitle: t.status === 'completed' ? 'Complété' : 'En attente',
            amount: Math.abs(t.amount || 0),
            currency: t.currency || 'CDF',
            status: t.status,
            timestamp: t.created_at,
            counterpartyName: contactName,
            raw: t,
          };
        });
        allItems.push(...transferItems);
      }

      // Trier par timestamp
      allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Mettre en cache
      activityCache = {
        data: allItems,
        timestamp: Date.now(),
        expires: Date.now() + CACHE_DURATION
      };

      setActivities(allItems);
      setRetryCount(0);
      console.log(`✅ ${allItems.length} activités chargées avec succès`);

    } catch (err: any) {
      console.error('❌ Erreur chargement activités:', err);
      setRetryCount(prev => prev + 1);
      
      // Détecter type d'erreur pour affichage approprié
      const isRLSError = err.message?.includes('policy') || 
                         err.message?.includes('permission') ||
                         err.code === '42501' ||
                         err.message?.includes('RLS');
      
      const isNetworkError = err.message?.includes('Timeout') ||
                             err.message?.includes('network') ||
                             err.message?.includes('fetch');
      
      // Utiliser le cache en cas d'erreur si disponible
      if (activityCache && activityCache.data.length > 0 && !isRLSError) {
        console.warn('📦 Utilisation du cache de secours (données potentiellement obsolètes)');
        setActivities(activityCache.data);
        setError('Données en cache (connexion limitée)'); // ✅ Afficher avertissement
      } else {
        // Si erreur RLS ou pas de cache, afficher l'erreur
        if (isRLSError) {
          console.error('🔒 Erreur RLS détectée - Vérifier les permissions');
          setError('Problème de permissions. Contactez le support si le problème persiste.');
        } else if (isNetworkError) {
          setError('Problème de connexion. Vérifiez votre réseau.');
        } else {
          setError(err.message || 'Erreur de connexion');
        }
        setActivities([]); // ✅ Vider les données si erreur critique
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Auto-fetch au montage
  useEffect(() => {
    fetchAllActivities();
  }, [fetchAllActivities]);

  // Réessayer automatiquement en cas d'erreur (max 3 fois)
  useEffect(() => {
    if (error && retryCount < 3 && retryCount > 0) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 Retry automatique ${retryCount}/3`);
        fetchAllActivities(false);
      }, retryCount * 2000);

      return () => clearTimeout(retryTimeout);
    }
  }, [error, retryCount, fetchAllActivities]);

  // Fonction de refresh manuel
  const refresh = useCallback(() => {
    activityCache = null; // Vider le cache
    setRetryCount(0);
    fetchAllActivities(false);
  }, [fetchAllActivities]);

  // WebSocket temps réel optimisé
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('unified-activity-robust');

    const handleChange = () => {
      console.log('🔄 Changement détecté, rechargement des activités');
      // Attendre 1 seconde pour éviter les appels multiples
      setTimeout(() => fetchAllActivities(false), 1000);
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_bookings' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_orders' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, handleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAllActivities]);

  // Stats calculées
  const stats = useMemo(() => {
    const totalAmount = activities
      .filter(a => a.amount && a.type !== 'payment')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const completedCount = activities.filter(a => 
      a.status === 'completed' || a.status === 'delivered' || a.status === 'finished'
    ).length;

    return {
      total: activities.length,
      completed: completedCount,
      totalAmount,
      pending: activities.filter(a => a.status === 'pending' || a.status === 'confirmed').length
    };
  }, [activities]);

  return {
    activities,
    loading,
    error,
    refresh,
    retryCount,
    stats,
    isFromCache: activityCache && Date.now() < activityCache.expires
  };
};