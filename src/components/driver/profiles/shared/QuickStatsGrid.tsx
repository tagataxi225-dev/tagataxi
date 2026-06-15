/**
 * 📊 Grille Stats Compacte 2x2 - Design Moderne
 */

import { motion } from 'framer-motion';
import { Car, Package, Star, TrendingUp, Crown, Calendar, Zap } from 'lucide-react';
import { useDriverSubscription } from '@/hooks/useDriverSubscription';
import { differenceInDays } from 'date-fns';

interface QuickStatsGridProps {
  completedRides: number | string;
  rating: string;
  acceptanceRate: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    plate?: string;
  };
  serviceType: 'taxi' | 'delivery';
  loading?: boolean;
}

export const QuickStatsGrid = ({
  completedRides,
  rating,
  acceptanceRate,
  vehicleInfo,
  serviceType,
  loading = false
}: QuickStatsGridProps) => {
  const { subscription, loading: subLoading } = useDriverSubscription(serviceType);

  const themeColor = serviceType === 'taxi' ? 'text-primary' : 'text-green-500';
  const themeBg = serviceType === 'taxi' ? 'bg-primary/5' : 'bg-green-500/5';
  const themeBorder = serviceType === 'taxi' ? 'border-primary/10' : 'border-green-500/10';

  const daysRemaining = subscription.expiresAt 
    ? differenceInDays(new Date(subscription.expiresAt), new Date())
    : null;

  if (loading || subLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-card animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: serviceType === 'taxi' ? Car : Package,
      label: serviceType === 'taxi' ? 'Courses' : 'Livraisons',
      value: completedRides,
      subtext: 'ce mois',
      color: themeColor
    },
    {
      icon: Star,
      label: 'Note',
      value: rating,
      subtext: acceptanceRate,
      color: 'text-amber-500'
    },
    {
      icon: Crown,
      label: subscription.planLabel,
      value: subscription.ridesRemaining !== null ? `${subscription.ridesRemaining}` : '∞',
      subtext: subscription.ridesRemaining !== null ? 'restantes' : 'illimité',
      color: subscription.plan === 'premium' ? 'text-purple-500' : 'text-primary',
      highlight: subscription.plan === 'premium' || subscription.plan === 'pro'
    },
    {
      icon: serviceType === 'taxi' ? Car : Package,
      label: vehicleInfo?.make || 'Véhicule',
      value: vehicleInfo?.model || '--',
      subtext: vehicleInfo?.plate || 'Non renseigné',
      color: 'text-muted-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={`relative rounded-xl p-3.5 border ${
            stat.highlight 
              ? 'bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20' 
              : `${themeBg} ${themeBorder}`
          }`}
        >
          <div className="flex items-start justify-between">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            {stat.highlight && (
              <Zap className="w-3 h-3 text-amber-500" />
            )}
          </div>
          
          <div className="mt-2">
            <p className="text-xl font-bold text-foreground leading-none">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {stat.subtext}
            </p>
          </div>

          <p className="text-[10px] text-muted-foreground/70 mt-1.5 uppercase tracking-wide">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
