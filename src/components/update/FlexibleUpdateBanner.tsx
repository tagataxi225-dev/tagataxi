import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFlexibleUpdate } from '@/hooks/useFlexibleUpdate';

export const FlexibleUpdateBanner = () => {
  const { 
    status,
    isDownloading, 
    isReadyToInstall, 
    isInstalling,
    progress, 
    installNow 
  } = useFlexibleUpdate();

  // N'afficher que pendant téléchargement, prêt ou installation
  const shouldShow = isDownloading || isReadyToInstall || isInstalling;

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-0 inset-x-0 z-[100] safe-area-top"
      >
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-lg">
          <div className="px-4 py-3">
            {isDownloading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      Téléchargement de la mise à jour...
                    </span>
                    <span className="text-white/90 text-xs font-semibold">
                      {progress}%
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-1.5 bg-white/30"
                  />
                </div>
              </motion.div>
            )}

            {isReadyToInstall && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <div>
                    <span className="text-white text-sm font-semibold block">
                      Mise à jour prête !
                    </span>
                    <span className="text-white/80 text-xs">
                      Installation automatique dans quelques secondes
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={installNow}
                  className="bg-white text-emerald-600 hover:bg-white/90 font-semibold shadow-md"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Installer
                </Button>
              </motion.div>
            )}

            {isInstalling && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-1"
              >
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-white text-sm font-medium">
                  Installation en cours...
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
