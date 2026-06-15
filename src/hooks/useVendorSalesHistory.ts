import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Sale {
  id: string;
  product_title: string;
  buyer_name: string;
  quantity: number;
  total_amount: number;
  commission: number;
  status: string;
  created_at: string;
}

export const useVendorSalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    if (user) {
      loadSalesHistory();
    }
  }, [user]);

  const loadSalesHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from('marketplace_orders')
        .select(`
          id,
          quantity,
          total_amount,
          status,
          created_at,
          buyer_id,
          product_id,
          marketplace_products (
            title
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedSales: Sale[] = await Promise.all(
        (orders || []).map(async (order: any) => {
          // Get buyer name
          const { data: buyerData } = await supabase
            .from('clients')
            .select('display_name')
            .eq('user_id', order.buyer_id)
            .maybeSingle();

          return {
            id: order.id,
            product_title: order.marketplace_products?.title || 'Produit supprimé',
            buyer_name: buyerData?.display_name || 'Client',
            quantity: order.quantity || 1,
            total_amount: order.total_amount || 0,
            commission: order.total_amount ? order.total_amount * 0.05 : 0, // 5% commission
            status: order.status || 'pending',
            created_at: order.created_at
          };
        })
      );

      setSales(transformedSales);

      // Calculate totals
      const revenue = transformedSales
        .filter(s => s.status === 'delivered' || s.status === 'completed')
        .reduce((sum, sale) => sum + sale.total_amount, 0);
      
      const count = transformedSales.filter(
        s => s.status === 'delivered' || s.status === 'completed'
      ).length;

      setTotalRevenue(revenue);
      setTotalSales(count);

    } catch (error) {
      console.error('Error loading sales history:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    sales,
    loading,
    totalRevenue,
    totalSales,
    refetch: loadSalesHistory
  };
};
