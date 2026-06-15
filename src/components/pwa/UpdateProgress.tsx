import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const motivationalMessages = [
  "Installation des nouveautés...",
  "Préparation de votre expérience...",
  "Presque terminé !",
  "C'est parti !",
];

export const UpdateProgress = () => {
  const { isUpdating } = useAppUpdate();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isUpdating) {
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    // Animation de la barre de progression
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Changement des messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isUpdating]);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-8 space-y-6"
          >
            {/* Logo animé */}
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center"
              >
                <RefreshCw className="w-8 h-8 text-primary-foreground" />
              </motion.div>
            </div>

            {/* Titre */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Mise à jour en cours...
              </h2>
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground"
              >
                {motivationalMessages[messageIndex]}
              </motion.p>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Installation...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Message d'information */}
            <p className="text-center text-sm text-muted-foreground">
              Ne fermez pas cette fenêtre
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
