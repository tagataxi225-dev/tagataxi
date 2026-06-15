import { useEffect } from 'react';
import { cleanupOldPendingOrders } from '@/utils/orderCleanup';
import { useAuth } from './useAuth';

export const useOrderCleanup = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const performCleanup = async () => {
      await cleanupOldPendingOrders();
    };

    performCleanup();

    const cleanupInterval = setInterval(performCleanup, 10 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [user?.id]);
};
