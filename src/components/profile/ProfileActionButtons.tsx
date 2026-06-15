import React from 'react';
import { Tag, Gift, Wallet, Star, Ticket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVIPStatus } from '@/hooks/useVIPStatus';

interface ProfileActionButtonsProps {
  onQuickAction?: (action: string) => void;
  className?: string;
}

export const ProfileActionButtons = ({ onQuickAction, className }: ProfileActionButtonsProps) => {
  const { vipStatus, loading: vipLoading } = useVIPStatus();

  const handleReferral = () => {
    onQuickAction?.('referral');
  };

  const handlePromoCode = () => {
    onQuickAction?.('promocode');
  };

  const handleTombola = () => {
    onQuickAction?.('tombola');
  };

  const handleWallet = () => {
    onQuickAction?.('wallet');
  };

  const quickActions = [
    {
      id: 'referral',
      icon: Gift,
      label: 'Parrainage',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-500',
      action: handleReferral
    },
    {
      id: 'promocode',
      icon: Tag,
      label: 'Promos',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      iconColor: 'text-orange-500',
      action: handlePromoCode
    },
    {
      id: 'tombola',
      icon: Ticket,
      label: 'Tombola',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-500',
      action: handleTombola,
      hasNotification: true
    }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* TembeaPay Wallet - Design soft */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary/10 border border-primary/20 p-4 cursor-pointer group hover:bg-primary/15 transition-colors"
        onClick={handleWallet}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/15 group-hover:bg-primary/20 transition-colors">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-primary text-lg font-bold">TembeaPay</span>
            <div className="text-primary/70 text-sm">Mon portefeuille</div>
          </div>
          <div className="p-2 rounded-full">
            <ChevronRight className="h-5 w-5 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.action}
            className={cn(
              "relative rounded-xl p-4 transition-all",
              "hover:scale-[1.02] active:scale-95",
              "flex flex-col items-center gap-2",
              "bg-card border border-border/50",
              "hover:border-border hover:shadow-sm"
            )}
          >
            <div className={cn("p-2.5 rounded-lg", action.bgColor)}>
              <action.icon className={cn("h-5 w-5", action.iconColor)} />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
            
            {action.hasNotification && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-400 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      {/* VIP Status - Design neutre */}
      {!vipLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-3.5 bg-muted/40 border border-border/40"
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-lg bg-muted/60"
            >
              <Star 
                className="h-5 w-5" 
                style={{ color: vipStatus.currentLevel.color }}
                fill={vipStatus.currentLevel.color}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Statut VIP</span>
                <span className="text-base">{vipStatus.currentLevel.icon}</span>
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted/60"
                  style={{ color: vipStatus.currentLevel.color }}
                >
                  {vipStatus.currentLevel.name}
                </span>
              </div>
              
              {/* Progress bar — gradient animé */}
              <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                <style>{`@keyframes vipShimmer{0%{background-position:200% center}100%{background-position:-200% center}}`}</style>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vipStatus.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${vipStatus.currentLevel.color}99, ${vipStatus.currentLevel.color}, #FFD700, ${vipStatus.currentLevel.color})`,
                    backgroundSize: '300% 100%',
                    animation: 'vipShimmer 2.5s linear infinite',
                  }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour ${vipStatus.nextLevel.name}`
                  : 'Niveau maximum atteint'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};
