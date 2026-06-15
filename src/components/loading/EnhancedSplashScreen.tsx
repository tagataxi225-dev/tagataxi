import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PreloadManager } from "@/services/PreloadManager";
import { AppReadySignal } from "@/services/AppReadySignal";
import { AnimationController } from "@/services/AnimationController";

interface EnhancedSplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
  maxDuration?: number;
}

export const EnhancedSplashScreen = ({ 
  onComplete, 
  minDuration = 1500,
  maxDuration = 3000 
}: EnhancedSplashScreenProps) => {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initialisation...");

  useEffect(() => {
    const startTime = Date.now();
    let progressInterval: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / maxDuration) * 100, 95);
      setProgress(newProgress);

      // Mettre à jour le texte selon la progression
      if (newProgress < 30) {
        setStatusText("Initialisation...");
      } else if (newProgress < 60) {
        setStatusText("Préparation...");
      } else {
        setStatusText("Prêt !");
      }
    };

    // Mettre à jour la progression toutes les 50ms
    progressInterval = setInterval(updateProgress, 50);

    // Vérifier si tout est prêt
    const checkReady = async () => {
      const elapsed = Date.now() - startTime;

      // Attendre au minimum minDuration
      if (elapsed < minDuration) return;

      // Vérifier si les ressources critiques sont prêtes
      try {
        await PreloadManager.waitForCriticalResources();
        
        // Si tout est prêt et durée minimum écoulée
        if (AppReadySignal.getState().dom && AppReadySignal.getState().fonts) {
          setProgress(100);
          setStatusText("Prêt !");
          
          // Attendre un peu pour montrer 100%
          setTimeout(() => {
            setShow(false);
            setTimeout(onComplete, 400);
          }, 300);

          clearInterval(checkInterval);
          clearInterval(progressInterval);
        }
      } catch (error) {
        console.warn("Erreur lors du chargement:", error);
      }

      // Timeout maximum
      if (elapsed >= maxDuration) {
        setProgress(100);
        setShow(false);
        setTimeout(onComplete, 400);
        clearInterval(checkInterval);
        clearInterval(progressInterval);
      }
    };

    // Vérifier toutes les 100ms
    checkInterval = setInterval(checkReady, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(checkInterval);
    };
  }, [onComplete, minDuration, maxDuration]);

  const animConfig = AnimationController.getRecommendedConfig();
  const isReduced = AnimationController.isReducedMode();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animConfig.duration / 1000 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(0 84% 60%) 0%, hsl(0 73% 40%) 50%, hsl(0 45% 25%) 100%)"
          }}
        >
          {/* Particules optimisées - seulement 6 */}
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

          {/* Logo avec animation simple */}
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
              
              {/* Logo avec animation douce */}
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

            {/* Barre de progression */}
            <div className="w-64 space-y-2">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                />
              </div>
              <motion.p
                className="text-center text-white/90 text-sm font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {statusText}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
