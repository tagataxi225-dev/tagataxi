import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

const fetchVendorStats = async (): Promise<VendorStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Récupérer les données en parallèle depuis les bonnes tables
  const [productsResult, ordersResult, escrowResult, walletResult] = await Promise.all([
    // Produits
    supabase
      .from('marketplace_products')
      .select('moderation_status')
      .eq('seller_id', user.id),
    
    // Commandes
    supabase
      .from('marketplace_orders')
      .select('status')
      .eq('seller_id', user.id),
    
    // ✅ CORRECTION: Utiliser escrow_payments au lieu de escrow_transactions
    supabase
      .from('escrow_payments')
      .select('amount, status')
      .eq('seller_id', user.id),
    
    // Wallet vendeur pour le solde disponible
    supabase
      .from('vendor_wallets')
      .select('balance')
      .eq('vendor_id', user.id)
      .maybeSingle()
  ]);

  // Calculer les stats produits
  const products = productsResult.data || [];
  const activeProducts = products.filter(p => p.moderation_status === 'approved').length;
  const pendingProducts = products.filter(p => p.moderation_status === 'pending').length;

  // Calculer les stats commandes
  const orders = ordersResult.data || [];
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => 
    o.status === 'pending_seller_confirmation' || 
    o.status === 'confirmed' ||
    o.status === 'processing'
  ).length;

  // ✅ CORRECTION: Calculer escrow depuis escrow_payments (90% pour vendeur)
  const escrowPayments = escrowResult.data || [];
  const pendingEscrow = escrowPayments
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + Math.round((e.amount || 0) * 0.9), 0);

  // Solde disponible depuis wallet
  const escrowBalance = walletResult.data?.balance || 0;

  return {
    activeProducts,
    pendingProducts,
    totalOrders,
    pendingOrders,
    escrowBalance,
    pendingEscrow
  };
};

export const useVendorStats = () => {
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: fetchVendorStats,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2
  });

  return { 
    stats: stats || {
      activeProducts: 0,
      pendingProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      escrowBalance: 0,
      pendingEscrow: 0
    }, 
    loading, 
    refetch 
  };
};
