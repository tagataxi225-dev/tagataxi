import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Zap, Truck, Users, TrendingUp, DollarSign, Activity, ArrowRight, Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { usePartnerActivity } from '@/hooks/usePartnerActivity';
import { PartnerEarningsCard } from '../PartnerEarningsCard';
import { ModernPartnerWallet } from '../wallet/ModernPartnerWallet';

interface PartnerDeliveryDashboardProps {
  onViewChange: (view: string) => void;
  partnerProfile?: any;
}

const deliveryTypes = [
  { 
    id: 'flash', 
    label: 'Flash', 
    icon: Zap, 
    desc: 'Moto · Express',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-orange-500',
  },
  { 
    id: 'flex', 
    label: 'Flex', 
    icon: Package, 
    desc: 'Camionnette · Standard',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
  },
  { 
    id: 'maxi', 
    label: 'MaxiCharge', 
    icon: Truck, 
    desc: 'Camion · Lourd',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const PartnerDeliveryDashboard = ({ onViewChange, partnerProfile }: PartnerDeliveryDashboardProps) => {
  const { stats, loading } = usePartnerStats();
  const { activities } = usePartnerActivity();

  return (
    <div className="space-y-3">
      {/* Hero Banner */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4 }}
        className="mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-orange-500/20 p-5 text-white relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
              Partenaire Delivery
            </Badge>
          </div>
          <h1 className="text-xl font-bold mb-1">
            Bonjour, {partnerProfile?.contact_name?.split(' ')[0] || 'Partenaire'} !
          </h1>
          <p className="text-white/75 text-sm">{partnerProfile?.company_name}</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90">Système actif</span>
            </div>
            <span className="text-white/50">·</span>
            <span className="text-white/75">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3 px-4"
      >
        {[
          {
            label: 'Livreurs actifs',
            value: loading ? '…' : String(stats?.activeDrivers || 0),
            icon: Users,
            sub: 'En service',
            accent: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
          },
          {
            label: 'Livraisons du jour',
            value: loading ? '…' : String(stats?.completedRides || 0),
            icon: Package,
            sub: 'Terminées',
            accent: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-950/30',
          },
          {
            label: 'En cours',
            value: loading ? '…' : String(stats?.ongoingRides || 0),
            icon: Activity,
            sub: 'Temps réel',
            accent: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
          {
            label: 'CA du jour',
            value: loading ? '…' : `${(stats?.todayRevenue || 0).toLocaleString()}`,
            sub: 'CDF',
            icon: DollarSign,
            accent: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.accent}`} />
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.2 }}
        className="px-4"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Actions rapides
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-800 dark:hover:bg-orange-950/30 font-medium justify-between px-4"
            onClick={() => onViewChange('drivers')}
          >
            <span className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-orange-500" />
              Livreurs
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-xl border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-950/30 font-medium justify-between px-4"
            onClick={() => onViewChange('analytics')}
          >
            <span className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-red-500" />
              Analytics
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/30 font-medium justify-between px-4"
            onClick={() => onViewChange('wallet')}
          >
            <span className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Wallet
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Delivery Type Cards */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.25 }}
        className="px-4"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Vos services
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {deliveryTypes.map((dt) => (
            <button
              key={dt.id}
              onClick={() => onViewChange('drivers')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:shadow-md hover:border-border transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dt.gradientFrom} ${dt.gradientTo} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <dt.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-foreground">{dt.label}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{dt.desc}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Wallet & Withdrawals */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.3 }}
        className="px-4"
      >
        <ModernPartnerWallet />
      </motion.div>

      {/* Earnings Details */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.35 }}
        className="px-4"
      >
        <PartnerEarningsCard range="7d" />
      </motion.div>

      {/* Activity */}
      {activities && activities.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.35 }}
          className="px-4 pb-4"
        >
          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Activité récente
              </h3>
              <div className="relative space-y-0">
                {activities.slice(0, 4).map((a, i, arr) => (
                  <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-background shrink-0 z-10" />
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 bg-border absolute top-3 bottom-0" />
                      )}
                    </div>
                    <div className="min-w-0 -mt-0.5">
                      <p className="text-sm font-medium text-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground">Il y a {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
