import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedBalance } from '@/components/wallet/AnimatedBalance';

interface RestaurantWalletCardProps {
  balance: number;
  bonusBalance: number;
  monthlySpent: number;
  monthlyRecharged: number;
  onRecharge: () => void;
  loading?: boolean;
}

export const RestaurantWalletCard: React.FC<RestaurantWalletCardProps> = ({
  balance,
  bonusBalance,
  monthlySpent,
  monthlyRecharged,
  onRecharge,
  loading = false
}) => {
  const isLowBalance = balance < 10000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-2xl">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <CardContent className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white text-base font-bold">TAGAPay</p>
                <p className="text-xs text-white/60">Mon portefeuille</p>
              </div>
            </div>
            {isLowBalance && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-yellow-500/90 rounded-full text-xs font-medium"
              >
                ⚠️ Solde faible
              </motion.div>
            )}
          </div>

          {/* Balance principale */}
          <div className="space-y-1">
            <p className="text-white/80 text-sm">Solde disponible</p>
            {loading ? (
              <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <AnimatedBalance 
                value={balance} 
                currency="CDF" 
                className="text-4xl font-bold"
              />
            )}
          </div>

          {/* Stats mensuelles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                <TrendingUp className="h-3 w-3" />
                <span>Rechargé ce mois</span>
              </div>
              <p className="text-lg font-bold">{monthlyRecharged.toLocaleString()} CDF</p>
            </div>
            
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                <TrendingDown className="h-3 w-3" />
                <span>Dépensé ce mois</span>
              </div>
              <p className="text-lg font-bold">{monthlySpent.toLocaleString()} CDF</p>
            </div>
          </div>

          {/* Bonus si présent */}
          {bonusBalance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-yellow-500/20 backdrop-blur-sm rounded-xl border border-yellow-400/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80">Bonus disponible</p>
                  <p className="text-lg font-bold">{bonusBalance.toLocaleString()} CDF</p>
                </div>
                <div className="text-2xl">🎁</div>
              </div>
            </motion.div>
          )}

          {/* Button Recharge */}
          <Button
            onClick={onRecharge}
            className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Recharger mon wallet
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
