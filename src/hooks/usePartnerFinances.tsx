import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PartnerFinances {
  companyCredits: number;
  monthlySpent: number;
  totalEarnings: number;
  pendingPayments: number;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'commission';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export const usePartnerFinances = () => {
  const { user } = useAuth();
  const [finances, setFinances] = useState<PartnerFinances>({
    companyCredits: 0,
    monthlySpent: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(false);

  const fetchFinances = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get partner drivers to calculate commissions
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select('driver_id, commission_rate')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (driversError) {
        console.error('Error fetching partner drivers:', driversError);
        return;
      }

      const driverIds = partnerDrivers?.map(pd => pd.driver_id) || [];

      if (driverIds.length === 0) {
        setFinances(prev => ({ ...prev, totalEarnings: 0, monthlySpent: 0 }));
        return;
      }

      // Get this month's date range
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      // Fetch completed rides for this month
      const { data: transportBookings, error: transportError } = await supabase
        .from('transport_bookings')
        .select('actual_price, estimated_price, driver_id, created_at')
        .in('driver_id', driverIds)
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('actual_price, estimated_price, driver_id, created_at')
        .in('driver_id', driverIds)
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (transportError) console.error('Error fetching transport bookings:', transportError);
      if (deliveryError) console.error('Error fetching delivery orders:', deliveryError);

      const allCompletedRides = [
        ...(transportBookings || []),
        ...(deliveryOrders || [])
      ];

      // Calculate total earnings from commissions
      const totalEarnings = allCompletedRides.reduce((total, ride) => {
        const price = ride.actual_price || ride.estimated_price || 0;
        const driverInfo = partnerDrivers?.find(pd => pd.driver_id === ride.driver_id);
        const commissionRate = driverInfo?.commission_rate || 15;
        return total + (price * (commissionRate / 100));
      }, 0);

      // Calculate monthly spent (operational costs, etc.)
      const monthlySpent = totalEarnings * 0.3; // Estimate 30% operational costs

      // Simulate company credits (this could be stored in a separate table)
      const companyCredits = 50000 + (totalEarnings * 0.1); // Base credits + 10% of earnings

      // Generate recent transactions
      const recentTransactions: Transaction[] = allCompletedRides
        .slice(-10)
        .map((ride, index) => {
          const price = ride.actual_price || ride.estimated_price || 0;
          const driverInfo = partnerDrivers?.find(pd => pd.driver_id === ride.driver_id);
          const commissionRate = driverInfo?.commission_rate || 15;
          const commission = price * (commissionRate / 100);
          
          return {
            id: `trans_${index}`,
            type: 'commission' as const,
            amount: commission,
            description: `Commission sur course (${commissionRate}%)`,
            date: ride.created_at,
            status: 'completed' as const
          };
        })
        .reverse();

      // Add some sample credit transactions
      recentTransactions.unshift({
        id: 'credit_1',
        type: 'credit',
        amount: 10000,
        description: 'Recharge crédit entreprise',
        date: new Date().toISOString(),
        status: 'completed'
      });

      setFinances({
        companyCredits: Math.round(companyCredits),
        monthlySpent: Math.round(monthlySpent),
        totalEarnings: Math.round(totalEarnings),
        pendingPayments: Math.round(totalEarnings * 0.05), // 5% pending
        recentTransactions: recentTransactions.slice(0, 10)
      });

    } catch (error) {
      console.error('Error fetching partner finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const topUpCredits = async (amount: number) => {
    if (!user) return false;

    try {
      // Simulate credit top-up
      setFinances(prev => ({
        ...prev,
        companyCredits: prev.companyCredits + amount,
        recentTransactions: [
          {
            id: `topup_${Date.now()}`,
            type: 'credit',
            amount,
            description: 'Recharge crédit entreprise',
            date: new Date().toISOString(),
            status: 'completed'
          },
          ...prev.recentTransactions.slice(0, 9)
        ]
      }));

      return true;
    } catch (error) {
      console.error('Error topping up credits:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchFinances();
      
      // Refresh every 5 minutes (skip si app en arrière-plan)
      const interval = setInterval(() => {
        if (!document.hidden) fetchFinances();
      }, 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    finances,
    loading,
    refreshFinances: fetchFinances,
    topUpCredits
  };
};