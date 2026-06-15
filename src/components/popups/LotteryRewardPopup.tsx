import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';

interface LotteryRewardPopupProps {
  show: boolean;
  amount: number;
  currency?: string;
  onClose: () => void;
  onClaim: () => void;
}

export const LotteryRewardPopup = ({
  show,
  amount,
  currency = 'CDF',
  onClose,
  onClaim
}: LotteryRewardPopupProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <SuccessConfetti show={show} />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                duration: 0.5,
                bounce: 0.4
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-3xl p-8 text-center shadow-2xl"
            >
              {/* Sparkles */}
              <div className="absolute -top-4 -right-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-yellow-300" fill="currentColor" />
              </div>
              <div className="absolute -bottom-4 -left-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                <Sparkles className="w-8 h-8 text-yellow-300" fill="currentColor" />
              </div>

              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.4, 0.6, 1]
                }}
                className="flex justify-center mb-4"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Gift className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Félicitations ! 🎉
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mb-6"
              >
                Vous avez gagné
              </motion.p>

              {/* Amount */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
                className="mb-8"
              >
                <motion.p
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255,255,255,0.5)',
                      '0 0 40px rgba(255,255,255,0.8)',
                      '0 0 20px rgba(255,255,255,0.5)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl font-extrabold text-white"
                >
                  {amount.toLocaleString()}
                </motion.p>
                <p className="text-2xl font-bold text-white/90 mt-1">{currency}</p>
              </motion.div>

              {/* Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  size="lg"
                  className="w-full text-base font-semibold bg-white text-orange-600 hover:bg-white/90 shadow-lg animate-bounce-subtle"
                  onClick={() => {
                    onClaim();
                    onClose();
                  }}
                >
                  Récupérer mes gains 🎁
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
