import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ActivityType = 'delivery' | 'marketplace_purchase' | 'marketplace_sale' | 'payment';

export interface UnifiedActivityItem {
  id: string;
  type: ActivityType;
  title: string; // e.g., "Cocody → Plateau" or "Commande Marketplace"
  subtitle?: string; // e.g., status or brief detail
  amount?: number;
  currency?: string;
  status?: string;
  timestamp: string; // ISO string
  counterpartyName?: string;
  raw?: any; // original row for details
}

export const useUnifiedActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UnifiedActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) {
      setActivities([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Delivery orders
      const { data: deliveries, error: delError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (delError) throw delError;

      const deliveryItems: UnifiedActivityItem[] = (deliveries || []).map((d: any) => ({
        id: d.id,
        type: 'delivery',
        title: `${d.pickup_location || 'Départ'} → ${d.delivery_location || 'Destination'}`,
        subtitle: d.status,
        amount: d.actual_price ?? d.estimated_price ?? undefined,
        currency: 'CDF',
        status: d.status,
        timestamp: d.updated_at || d.created_at,
        raw: d,
      }));

      // Marketplace orders - as buyer
      const { data: ordersAsBuyer, error: moBuyerError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (moBuyerError) throw moBuyerError;

      const marketplaceBuyerItems: UnifiedActivityItem[] = (ordersAsBuyer || []).map((o: any) => ({
        id: o.id,
        type: 'marketplace_purchase',
        title: `Achat #${String(o.id).slice(0, 6)}`,
        subtitle: `${o.status} • Paiement: ${o.payment_status}`,
        amount: o.total_amount ?? o.unit_price * (o.quantity || 1),
        currency: 'CDF',
        status: o.status,
        timestamp: o.updated_at || o.created_at,
        raw: o,
      }));

      // Marketplace orders - as seller
      const { data: ordersAsSeller, error: moSellerError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (moSellerError) throw moSellerError;

      const marketplaceSellerItems: UnifiedActivityItem[] = (ordersAsSeller || []).map((o: any) => ({
        id: o.id,
        type: 'marketplace_sale',
        title: `Vente #${String(o.id).slice(0, 6)}`,
        subtitle: `${o.status} • Livraison: ${o.delivery_method || 'pickup'}`,
        amount: o.total_amount ?? o.unit_price * (o.quantity || 1),
        currency: 'CDF',
        status: o.status,
        timestamp: o.updated_at || o.created_at,
        raw: o,
      }));

      // Payments
      const { data: payments, error: payError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (payError) throw payError;

      const paymentItems: UnifiedActivityItem[] = (payments || []).map((p: any) => ({
        id: p.id,
        type: 'payment',
        title: `Paiement ${p.transaction_id ? '#' + String(p.transaction_id).slice(0, 6) : ''}`.trim(),
        subtitle: p.status,
        amount: p.amount,
        currency: p.currency || 'CDF',
        status: p.status,
        timestamp: p.updated_at || p.created_at,
        raw: p,
      }));

      const merged = [
        ...deliveryItems,
        ...marketplaceBuyerItems,
        ...marketplaceSellerItems,
        ...paymentItems,
      ];

      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(merged);
    } catch (e: any) {
      console.error('Erreur chargement activité:', e);
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Realtime updates
    const channel = supabase.channel('unified-activity');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_orders' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refresh = () => fetchAll();

  return { activities, loading, error, refresh };
};
