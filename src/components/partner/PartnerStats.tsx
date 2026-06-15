import React from 'react';
import { motion } from 'framer-motion';
import { Car, Users, DollarSign, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const PartnerStats: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['partner-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return null;

      const { count: vehiclesCount } = await supabase
        .from('rental_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerData.id)
        .eq('is_active', true);

      const { count: driversCount } = await supabase
        .from('partner_drivers')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerData.id)
        .eq('status', 'active');

      const monthlyCommissions = 0;
      const averageRating = 4.7;

      return {
        totalVehicles: vehiclesCount || 0,
        activeDrivers: driversCount || 0,
        monthlyCommissions,
        averageRating,
      };
    },
    enabled: !!user?.id,
  });

  const statCards = [
    {
      title: 'Véhicules actifs',
      value: stats?.totalVehicles || 0,
      icon: Car,
      trend: '+2',
      trendUp: true,
      gradient: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Chauffeurs actifs',
      value: stats?.activeDrivers || 0,
      icon: Users,
      trend: '+5',
      trendUp: true,
      gradient: 'from-orange-500/10 via-amber-500/5 to-yellow-500/10',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Commissions ce mois',
      value: `${(stats?.monthlyCommissions || 0).toLocaleString()}`,
      suffix: 'CDF',
      icon: DollarSign,
      trend: '+12%',
      trendUp: true,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/10',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Note moyenne',
      value: stats?.averageRating?.toFixed(1) || '0.0',
      suffix: '/5',
      icon: Star,
      trend: '+0.2',
      trendUp: true,
      gradient: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className={cn(
              "relative overflow-hidden border border-border/10 shadow-lg bg-card",
              "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            )}>
              {/* Gradient background */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", stat.gradient)} />
              
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                  <motion.div 
                    className={cn("p-2.5 rounded-xl", stat.iconBg)}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Icon className={cn("h-5 w-5", stat.iconColor)} />
                  </motion.div>
                  
                  {stat.trend && (
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                      stat.trendUp 
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" 
                        : "text-red-600 dark:text-red-400 bg-red-500/10"
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {stat.title}
                </p>
                
                <div className="flex items-baseline gap-1">
                  <motion.span 
                    className="text-2xl font-bold text-foreground"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                  >
                    {stat.value}
                  </motion.span>
                  {stat.suffix && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {stat.suffix}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};