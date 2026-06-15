import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseCircuitBreaker } from '@/lib/circuitBreaker';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const isRecoveringRef = useRef(false);
  const initialSessionLoadedRef = useRef(false);
  const recoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        logger.info('🔐 Auth Provider initializing...');

        // 1. getSession() EN PREMIER — setUser immédiatement si session présente
        //    (lit localStorage/cookie, pas de réseau si token valide)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) logger.error('❌ Auth session error', error);

        initialSessionLoadedRef.current = true;
        logger.info('✅ Initial session loaded', { hasSession: !!initialSession });
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setSessionReady(true);
        setLoading(false);

        // 2. ENSUITE écouter les changements futurs (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED…)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;

          // INITIAL_SESSION déjà traité par getSession() ci-dessus — ignorer
          if (_event === 'INITIAL_SESSION') return;

          // 🛡️ Ne JAMAIS mettre user à null pendant la récupération foreground
          if (!session && isRecoveringRef.current) {
            logger.info('🛡️ Session null ignorée pendant récupération foreground');
            return;
          }

          logger.info('🔄 Auth state changed', { event: _event, hasSession: !!session });
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });

        authSubscription = subscription;

      } catch (error) {
        logger.error('❌ Auth initialization error', error);
        if (mounted) { setSession(null); setUser(null); }
      } finally {
        if (mounted) { setLoading(false); setSessionReady(true); }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  // 🛡️ FOREGROUND RECOVERY avec debounce 300ms + lock
  const recoverSession = useCallback(async () => {
    // Debounce: annuler tout appel précédent dans les 300ms
    if (recoverDebounceRef.current) {
      clearTimeout(recoverDebounceRef.current);
    }

    recoverDebounceRef.current = setTimeout(async () => {
      // Lock: un seul recovery à la fois
      if (isRecoveringRef.current) return;
      isRecoveringRef.current = true;
      
      logger.info('🔄 [AuthProvider] Foreground recovery...');
      
      // Reset circuit breaker au retour foreground
      supabaseCircuitBreaker.reset();
      
      try {
        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        
        if (error || !freshSession) {
          logger.info('🔄 [AuthProvider] Session expirée, tentative refresh...');
          const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshed) {
            logger.info('✅ [AuthProvider] Session rafraîchie avec succès');
            setSession(refreshed);
            setUser(refreshed.user);
          } else if (refreshError) {
            logger.warn('⚠️ [AuthProvider] Refresh échoué, session réellement perdue');
          }
        } else {
          setSession(freshSession);
          setUser(freshSession.user);
        }
      } catch (err) {
        logger.error('❌ [AuthProvider] Erreur recovery:', err);
      } finally {
        isRecoveringRef.current = false;
      }
    }, 300);
  }, []);

  useEffect(() => {
    // Web/PWA: visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recoverSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Capacitor natif: appStateChange
    let appStateCleanup: (() => void) | null = null;
    const setupCapacitorListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            recoverSession();
          }
        });
        appStateCleanup = () => listener.remove();
      } catch {
        // Capacitor non disponible (web pur), c'est OK
      }
    };
    setupCapacitorListener();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      appStateCleanup?.();
      if (recoverDebounceRef.current) clearTimeout(recoverDebounceRef.current);
    };
  }, [recoverSession]);

  // Auto-refresh session 5 min avant expiration
  useEffect(() => {
    if (!session?.expires_at) return;
    
    const expiresAt = session.expires_at * 1000;
    const refreshTime = Math.max(expiresAt - Date.now() - 5 * 60 * 1000, 0);
    
    if (refreshTime > 0) {
      const refreshTimeout = setTimeout(async () => {
        const { error } = await supabase.auth.refreshSession();
        if (error) logger.error('❌ Auto-refresh error:', error);
        else logger.info('✅ Session auto-refreshed');
      }, refreshTime);
      
      return () => clearTimeout(refreshTimeout);
    }
  }, [session]);

  const signOut = async () => {
    if (localStorage.getItem('kwenda_signing_out')) return;
    
    localStorage.setItem('kwenda_signing_out', 'true');
    
    let redirectPath = '/auth';
    try {
      const selectedRole = localStorage.getItem('kwenda_selected_role');
      const roleRedirectMap: Record<string, string> = {
        'driver': '/driver/auth',
        'partner': '/partner/auth',
        'restaurant': '/restaurant/auth',
        'admin': '/operatorx/admin/auth',
        'client': '/auth'
      };
      redirectPath = roleRedirectMap[selectedRole as string] || '/auth';
    } catch (error) {
      logger.warn('Unable to determine role for redirect:', error);
    }
    
    setUser(null);
    setSession(null);
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') ||
        key.startsWith('supabase') ||
        key.startsWith('kwenda_') ||
        key.includes('auth-token')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove
      .filter(k => k !== 'kwenda_signing_out')
      .forEach(k => localStorage.removeItem(k));
    
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    window.location.href = redirectPath;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
