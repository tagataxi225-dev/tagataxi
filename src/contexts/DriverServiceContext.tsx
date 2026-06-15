/**
 * 🔄 PHASE 7: Context global pour synchronisation chauffeur/livreur
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';

interface DriverProfile {
  id: string;
  user_id: string;
  full_name: string;
  photo_url?: string;
  phone?: string;
  service_type: 'taxi' | 'delivery';
}

interface WalletData {
  balance: number;
  bonus_balance: number;
  ecosystem_credits: number;
  kwenda_points: number;
}

interface ActiveOrder {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  status: string;
  data: any;
}

interface DriverServiceContextValue {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  profile: DriverProfile | null;
  wallet: WalletData | null;
  activeOrders: ActiveOrder[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshActiveOrders: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DriverServiceContext = createContext<DriverServiceContextValue | undefined>(undefined);

export const DriverServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { serviceType, loading: serviceTypeLoading } = useDriverServiceType();
  
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Charger le profil
  const refreshProfile = useCallback(async () => {
    if (!user || serviceType === 'unknown') return;

    try {
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (driverProfile) {
        setProfile({
          id: driverProfile.id,
          user_id: driverProfile.user_id,
          full_name: (driverProfile as any).full_name || (driverProfile as any).display_name || '',
          photo_url: (driverProfile as any).photo_url || undefined,
          phone: (driverProfile as any).phone || undefined,
          service_type: serviceType
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user, serviceType]);

  // ✅ Charger le wallet
  const refreshWallet = useCallback(async () => {
    if (!user) return;

    try {
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance, ecosystem_credits, kwenda_points')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  }, [user]);

  // ✅ Charger les commandes actives
  const refreshActiveOrders = useCallback(async () => {
    if (!user) return;

    try {
      const orders: ActiveOrder[] = [];

      // Commandes taxi
      const { data: taxiOrders } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'driver_assigned', 'in_progress']);

      if (taxiOrders) {
        orders.push(...taxiOrders.map(order => ({
          id: order.id,
          type: 'taxi' as const,
          status: order.status,
          data: order
        })));
      }

      // Commandes delivery
      const { data: deliveryOrders } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['driver_assigned', 'confirmed', 'picked_up', 'in_transit']);

      if (deliveryOrders) {
        orders.push(...deliveryOrders.map(order => ({
          id: order.id,
          type: 'delivery' as const,
          status: order.status,
          data: order
        })));
      }

      setActiveOrders(orders);
    } catch (error) {
      console.error('Error loading active orders:', error);
    }
  }, [user]);

  // ✅ Tout rafraîchir
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshProfile(),
        refreshWallet(),
        refreshActiveOrders()
      ]);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, refreshWallet, refreshActiveOrders]);

  // ✅ Charger au montage
  useEffect(() => {
    if (user && serviceType !== 'unknown') {
      refreshAll();
    }
  }, [user, serviceType, refreshAll]);

  // ✅ PHASE 7: Écoute Realtime pour synchronisation
  useEffect(() => {
    if (!user) return;

    // 1. Écouter les changements du profil
    const profileChannel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_profiles',
        filter: `user_id=eq.${user.id}`
      }, () => {
        refreshProfile();
      })
      .subscribe();

    // 2. Écouter les changements du wallet
    const walletChannel = supabase
      .channel('wallet-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        refreshWallet();
      })
      .subscribe();

    // 3. Écouter les nouvelles commandes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transport_bookings',
        filter: `driver_id=eq.${user.id}`
      }, () => {
        refreshActiveOrders();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_orders',
        filter: `driver_id=eq.${user.id}`
      }, () => {
        refreshActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, refreshProfile, refreshWallet, refreshActiveOrders]);

  const value: DriverServiceContextValue = {
    serviceType,
    profile,
    wallet,
    activeOrders,
    loading: loading || serviceTypeLoading,
    refreshProfile,
    refreshWallet,
    refreshActiveOrders,
    refreshAll
  };

  return (
    <DriverServiceContext.Provider value={value}>
      {children}
    </DriverServiceContext.Provider>
  );
};

// ✅ Hook pour utiliser le contexte
export const useDriverService = () => {
  const context = useContext(DriverServiceContext);
  if (context === undefined) {
    throw new Error('useDriverService must be used within a DriverServiceProvider');
  }
  return context;
};

// ✅ PHASE 7: Hooks dédiés par type
export const useTaxiDriver = () => {
  const context = useDriverService();
  if (context.serviceType !== 'taxi') {
    console.warn('useTaxiDriver called but driver is not a taxi driver');
  }
  return context;
};

export const useDeliveryDriver = () => {
  const context = useDriverService();
  if (context.serviceType !== 'delivery') {
    console.warn('useDeliveryDriver called but driver is not a delivery driver');
  }
  return context;
};
