import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsVendor = () => {
  const { user } = useAuth();
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsVendor(false);
      setLoading(false);
      return;
    }

    const checkVendorRole = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'vendor')
          .maybeSingle();
        
        if (error) {
          console.error('Error checking vendor role:', error);
          setIsVendor(false);
        } else {
          setIsVendor(!!data);
        }
      } catch (error) {
        console.error('Error in checkVendorRole:', error);
        setIsVendor(false);
      } finally {
        setLoading(false);
      }
    };

    checkVendorRole();
  }, [user]);

  return { isVendor, loading };
};
