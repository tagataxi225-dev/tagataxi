import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBalance } from './AnimatedBalance';
import { FloatingParticles } from './FloatingParticles';
import { cn } from '@/lib/utils';

interface EnhancedWalletCardProps {
  balance: number;
  currency: string;
  onTopUp?: () => void;
  loading?: boolean;
  compact?: boolean;
}

export const EnhancedWalletCard: React.FC<EnhancedWalletCardProps> = ({
  balance,
  currency,
  onTopUp,
  loading = false,
  compact = false
}) => {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="relative flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-congo-blue to-congo-red backdrop-blur-xl border border-white/20 shadow-lg">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
          >
            <Wallet className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 font-medium">TembeaPay</p>
            <p className="font-bold text-white text-sm truncate">
              {balance.toLocaleString('fr-CD')} {currency}
            </p>
          </div>
          {onTopUp && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={onTopUp}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl group"
    >
      <FloatingParticles />
      
      {/* Gradient background with Congo flag colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-congo-red via-congo-yellow to-congo-green opacity-90" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30"
            >
              <Wallet className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="text-sm text-white/80 font-medium">Mon Portefeuille</p>
              <p className="text-xs text-white/60">TembeaPay</p>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 px-3 py-1 bg-congo-green/30 rounded-full backdrop-blur-sm border border-congo-green/50"
          >
            <TrendingUp className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">Actif</span>
          </motion.div>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-sm text-white/70">Solde disponible</p>
          <AnimatedBalance value={balance} currency={currency} />
        </div>

        {onTopUp && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onTopUp}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-12 rounded-xl font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Recharger mon compte
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bottom accent line - Congo gradient animated */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-congo-flag animate-congo-gradient" style={{ backgroundSize: '200% 200%' }} />
    </motion.div>
  );
};
