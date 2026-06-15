import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

type AppReadyContextType = {
  sessionReady: boolean;
  userRole: string | null;
  contentReady: boolean;
  user: User | null;
  session: Session | null;
};

const AppReadyContext = createContext<AppReadyContextType | undefined>(undefined);

export const useAppReady = () => {
  const context = useContext(AppReadyContext);
  if (!context) {
    throw new Error('useAppReady must be used within AppReadyProvider');
  }
  return context;
};

interface AppReadyProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

/** Helper: fetch role with 2s timeout */
const fetchRoleWithTimeout = async (): Promise<string> => {
  try {
    const rolePromise = supabase.rpc('get_current_user_role');
    const timeoutPromise = new Promise<{ data: string }>((resolve) =>
      setTimeout(() => resolve({ data: 'client' }), 2000)
    );
    const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any;
    if (error) return 'client';
    return data || 'client';
  } catch {
    return 'client';
  }
};

export const AppReadyProvider = ({ children }: AppReadyProviderProps) => {
  // 🛡️ SOURCE DE VÉRITÉ UNIQUE: useAuth() du AuthProvider parent
  const { user, session, sessionReady } = useAuth();
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);

  // Safety timeout: forcer contentReady après 5s quoi qu'il arrive
  useEffect(() => {
    const safety = setTimeout(() => {
      if (!contentReady) {
        logger.warn('[AppReady] Safety timeout 5s – forcing contentReady');
        setUserRole(prev => prev || 'client');
        setContentReady(true);
      }
    }, 5000);
    return () => clearTimeout(safety);
  }, [contentReady]);

  // Fetch role quand l'utilisateur change
  useEffect(() => {
    if (!sessionReady) return;

    if (localStorage.getItem('kwenda_signing_out')) {
      setUserRole(null);
      setContentReady(true);
      return;
    }

    if (localStorage.getItem('onboarding_just_completed') === 'true') {
      setContentReady(true);
      return;
    }

    if (user) {
      let cancelled = false;
      fetchRoleWithTimeout().then(role => {
        if (!cancelled) {
          setUserRole(role);
          setContentReady(true);
        }
      });
      return () => { cancelled = true; };
    } else {
      setUserRole(null);
      setContentReady(true);
    }
  }, [user, sessionReady]);

  return (
    <AppReadyContext.Provider value={{ sessionReady, userRole, contentReady, user, session }}>
      {children}
    </AppReadyContext.Provider>
  );
};
