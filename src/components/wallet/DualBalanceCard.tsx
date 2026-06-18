import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Gift, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DualBalanceCardProps {
  mainBalance: number;
  bonusBalance: number;
  kwendaPoints: number;
  currency: string;
  loading?: boolean;
}

export const DualBalanceCard: React.FC<DualBalanceCardProps> = ({
  mainBalance,
  bonusBalance,
  kwendaPoints,
  currency,
  loading = false
}) => {
  const totalBalance = mainBalance + bonusBalance;

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 opacity-90" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80 font-medium">TembeaPay</p>
                <p className="text-xs text-white/60">Mon Portefeuille</p>
              </div>
            </div>
            
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Actif
            </Badge>
          </div>

          <div className="mb-6">
            <p className="text-sm text-white/70 mb-1">Solde Total</p>
            <motion.p
              key={totalBalance}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              {totalBalance.toLocaleString('fr-FR')} {currency}
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-white/70" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-white/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Solde retirable vers Mobile Money</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-white/60 mb-1">Solde Principal</p>
              <p className="text-lg font-bold text-white">
                {mainBalance.toLocaleString()} {currency}
              </p>
              <Badge variant="outline" className="mt-2 text-white/70 border-white/30">
                Retirable
              </Badge>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-400/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-yellow-300" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-yellow-300/70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Utilisable pour payer vos courses et commandes TAGA (non retirable)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-yellow-200/80 mb-1">Solde Bonus</p>
              <p className="text-lg font-bold text-yellow-100">
                {bonusBalance.toLocaleString()} {currency}
              </p>
              <Badge className="mt-2 bg-yellow-500/30 text-yellow-100 border-yellow-400/50">
                Non retirable
              </Badge>
            </Card>
          </div>

          {kwendaPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-purple-500/20 rounded-xl border border-purple-400/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-400/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🎁</span>
                  </div>
                  <div>
                    <p className="text-xs text-purple-200">Points TAGA</p>
                    <p className="text-sm font-bold text-purple-100">
                      {kwendaPoints} points
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-200/70">≈ Valeur</p>
                  <p className="text-sm font-semibold text-purple-100">
                    {((kwendaPoints / 100) * 1000).toLocaleString()} {currency}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400" />
      </motion.div>
    </div>
  );
};
