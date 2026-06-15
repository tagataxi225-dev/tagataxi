import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PreloadManager } from '@/services/PreloadManager';
import { AppReadySignal } from '@/services/AppReadySignal';
import { AnimationController } from '@/services/AnimationController';
import { supabase } from '@/integrations/supabase/client';
import { usePreloadCriticalData } from '@/hooks/usePreloadCriticalData';

interface PWASplashScreenProps {
  onComplete: (session?: any, userRole?: string | null) => void;
}

/**
 * 🚀 PWA SPLASH SCREEN OPTIMISÉ + PRÉCHARGEMENT INTELLIGENT
 * ✅ PHASE 5: Intégration du préchargement pendant le splash
 */
export const PWASplashScreen = ({ onComplete }: PWASplashScreenProps) => {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // ✅ PHASE 5: Lancer le préchargement des données critiques
  const preloadStatus = usePreloadCriticalData();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let completionTimeout: NodeJS.Timeout;
    const startTime = Date.now();
    
    // ✅ Durée adaptative selon l'état d'authentification
    let minDuration = 500;
    let maxDuration = 1500;

    const tryComplete = (session?: any, userRole?: string | null) => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < minDuration) {
        setTimeout(() => tryComplete(session, userRole), minDuration - elapsed);
        return;
      }

      setShow(false);
      setTimeout(() => onComplete(session, userRole), 200);
    };

    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 20;
      });
    }, 100);

    const preloadAppData = async () => {
      try {
        const [resourcesResult] = await Promise.allSettled([
          PreloadManager.waitForCriticalResources(),
        ]);

        const { data: { session } } = await supabase.auth.getSession();
        
        // ✅ Adapter la durée du splash selon l'authentification
        if (session?.user) {
          minDuration = 800;  // Utilisateur connecté : splash plus long pour masquer la navigation
        } else {
          minDuration = 400;  // Visiteur : splash court
        }
        
        let userRole: string | null = null;
        if (session?.user) {
          const [roleResult] = await Promise.allSettled([
            supabase.rpc('get_current_user_role'),
          ]);
          
          if (roleResult.status === 'fulfilled' && roleResult.value.data) {
            userRole = roleResult.value.data;
            PreloadManager.preloadCriticalRoutes(userRole);
          }
        }

        // ✅ PHASE 5: Attendre que le préchargement soit terminé
        if (preloadStatus.isReady && AppReadySignal.getIsReady()) {
          setProgress(100);
          tryComplete(session, userRole);
        } else {
          AppReadySignal.onReady(() => {
            setProgress(100);
            tryComplete(session, userRole);
          });
        }
      } catch (error) {
        console.error('Error preloading app data:', error);
        tryComplete(null, null);
      }
    };

    preloadAppData();

    completionTimeout = setTimeout(() => {
      setProgress(100);
      tryComplete(null, null);
    }, maxDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimeout);
    };
  }, [onComplete, preloadStatus.isReady]);

  const isReduced = AnimationController.isReducedMode();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.25 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(0 84% 60%) 0%, hsl(0 73% 40%) 50%, hsl(0 45% 25%) 100%)"
          }}
        >
          {/* Particules optimisées - Réduites à 6 */}
          {!isReduced && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => {
                const size = 40 + Math.random() * 20;
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/10"
                    style={{
                      width: size,
                      height: size,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.1, 0.25, 0.1],
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{
                      duration: 2.5 + Math.random(),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: Math.random(),
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Contenu central */}
          <div className="relative flex flex-col items-center justify-center z-10 gap-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
                duration: 0.6
              }}
              className="relative"
            >
              {/* Halo subtil */}
              {!isReduced && (
                <motion.div
                  className="absolute -inset-12 blur-[40px]"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)"
                  }}
                />
              )}
              
              {/* Logo avec animation simple et douce */}
              <motion.img
                src="/kwenda-splash-logo.png"
                alt="Tembea"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain relative z-10"
                animate={!isReduced ? {
                  scale: [1, 1.03, 1],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
