import React from 'react';
import { Users, Car, DollarSign, Wallet, TrendingUp, Package, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCard } from './shared/StatCard';
import { motion } from 'framer-motion';

interface PartnerKPIGridProps {
  stats: any;
}

export const PartnerKPIGrid: React.FC<PartnerKPIGridProps> = ({ stats }) => {
  const isMobile = useIsMobile();

  // 🛡️ Protection contre stats null/undefined
  if (!stats) {
    return (
      <div className="p-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-card/80 border border-gray-200/50 dark:border-border/50 p-6 animate-pulse">
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Chargement des statistiques...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeDrivers = stats?.activeDrivers || 0;
  const ongoingRides = stats?.ongoingRides || 0;
  const completedRides = stats?.completedRides || 0;
  const todayRevenue = stats?.todayRevenue || 0;
  const monthlyRevenue = stats?.monthlyRevenue || 0;
  const totalFleet = stats?.totalFleet || 0;
  const availableVehicles = stats?.availableVehicles || 0;

  // Use real trends from stats
  const driversTrend = stats?.driversTrend || 0;
  const revenueTrend = stats?.revenueTrend || 0;

  return (
    <div className="p-4 space-y-4">
      {/* Main KPIs Grid */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard
          icon={Users}
          label="Chauffeurs actifs"
          value={activeDrivers}
          badge={{
            text: activeDrivers > 0 ? 'Actifs' : 'Aucun',
            icon: CheckCircle,
            variant: activeDrivers > 0 ? 'success' : 'info'
          }}
          trend={{
            value: driversTrend,
            isPositive: true
          }}
        />

        <StatCard
          icon={Car}
          label="Courses en cours"
          value={ongoingRides}
          badge={{
            text: ongoingRides > 0 ? 'En cours' : 'Aucune',
            icon: TrendingUp,
            variant: ongoingRides > 0 ? 'info' : 'warning'
          }}
        />

        <StatCard
          icon={Package}
          label="Courses terminées"
          value={completedRides}
          badge={{
            text: 'Ce mois',
            variant: 'success'
          }}
        />

        <StatCard
          icon={DollarSign}
          label="Revenus du jour"
          value={todayRevenue.toLocaleString()}
          suffix="CDF"
          badge={{
            text: 'Aujourd\'hui',
            variant: 'success'
          }}
          trend={{
            value: revenueTrend,
            isPositive: true
          }}
        />
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <StatCard
          icon={Wallet}
          label="Revenus mensuels"
          value={monthlyRevenue.toLocaleString()}
          suffix="CDF"
          badge={{
            text: 'Ce mois',
            icon: TrendingUp,
            variant: 'success'
          }}
          className="w-full"
        />
      </motion.div>

      {/* Fleet Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-card/80 border border-gray-200/50 dark:border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <Car className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  État de la flotte
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Disponibilité en temps réel
                </p>
              </div>
            </div>
            
            <div className={`grid gap-6 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Véhicules disponibles
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {availableVehicles}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  sur {totalFleet} au total
                </p>
              </div>
              
              <div className={isMobile ? 'text-center' : 'text-right'}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Taux d'utilisation
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalFleet > 0 ? Math.round(((totalFleet - availableVehicles) / totalFleet) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalFleet - availableVehicles} véhicules en service
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progression</span>
                <span className="font-medium">
                  {totalFleet > 0 ? Math.round(((totalFleet - availableVehicles) / totalFleet) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={totalFleet > 0 ? ((totalFleet - availableVehicles) / totalFleet) * 100 : 0} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
