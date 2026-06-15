import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface POSTransactionItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface POSTransaction {
  id: string;
  session_id: string;
  restaurant_id: string;
  transaction_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: POSTransactionItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'kwenda_pay';
  payment_reference: string | null;
  served_by: string;
  created_at: string;
  notes: string | null;
}

export const usePOSTransactions = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createTransaction = async (
    sessionId: string,
    restaurantId: string,
    items: POSTransactionItem[],
    paymentMethod: 'cash' | 'card' | 'mobile_money' | 'kwenda_pay',
    options?: {
      customerName?: string;
      customerPhone?: string;
      discountAmount?: number;
      discountReason?: string;
      notes?: string;
    }
  ) => {
    try {
      setLoading(true);

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = options?.discountAmount || 0;
      const taxAmount = 0; // TVA à implémenter si nécessaire
      const totalAmount = subtotal - discountAmount + taxAmount;

      const { data: transaction, error } = await supabase
        .from('restaurant_pos_transactions')
        .insert({
          session_id: sessionId,
          restaurant_id: restaurantId,
          customer_name: options?.customerName || null,
          customer_phone: options?.customerPhone || null,
          items: items as any,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          discount_reason: options?.discountReason || null,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          notes: options?.notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Vente enregistrée',
        description: `Total: ${totalAmount.toLocaleString()} CDF`,
      });

      return transaction;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSessionTransactions = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_pos_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting transactions:', error);
      return [];
    }
  };

  const getTodayTransactions = async (restaurantId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('restaurant_pos_transactions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting today transactions:', error);
      return [];
    }
  };

  return {
    loading,
    createTransaction,
    getSessionTransactions,
    getTodayTransactions,
  };
};
