import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, Building2, TrendingUp, DollarSign, Activity, ArrowRight, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { usePartnerActivity } from '@/hooks/usePartnerActivity';
import { PartnerEarningsCard } from '../PartnerEarningsCard';

interface PartnerAutoDashboardProps {
  onViewChange: (view: string) => void;
  partnerProfile?: any;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const PartnerAutoDashboard = ({ onViewChange, partnerProfile }: PartnerAutoDashboardProps) => {
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
        className="mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 shadow-lg shadow-blue-600/20 p-6 text-white relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
              Partenaire Auto
            </Badge>
          </div>
          <h1 className="text-xl font-bold mb-1">
            Bonjour, {partnerProfile?.contact_name?.split(' ')[0] || 'Partenaire'} !
          </h1>
          <p className="text-white/75 text-sm">{partnerProfile?.company_name}</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90">Flotte active</span>
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
            label: 'Chauffeurs actifs',
            value: loading ? '…' : String(stats?.activeDrivers || 0),
            icon: Users,
            sub: 'En service',
            accent: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
          },
          {
            label: 'Courses du jour',
            value: loading ? '…' : String(stats?.completedRides || 0),
            icon: Car,
            sub: 'Terminées',
            accent: 'text-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
          },
          {
            label: 'En cours',
            value: loading ? '…' : String(stats?.ongoingRides || 0),
            icon: Activity,
            sub: 'Temps réel',
            accent: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          },
          {
            label: 'Satisfaction',
            value: loading ? '…' : `${stats?.averageRating || '—'}`,
            sub: `${stats?.totalReviews || 0} avis`,
            icon: Star,
            accent: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.accent}`} />
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

      {/* Revenue Card */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.15 }}
        className="px-4"
      >
        <Card className="border-border/50 shadow-sm rounded-2xl bg-gradient-to-br from-card to-blue-50/30 dark:to-blue-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">CA du mois</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '…' : `${(stats?.monthlyRevenue || 0).toLocaleString()} CDF`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                Ce mois
              </Badge>
            </div>
          </CardContent>
        </Card>
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-16 rounded-xl border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:hover:bg-blue-950/30 font-medium justify-center flex-col gap-1"
            onClick={() => onViewChange('drivers')}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Chauffeurs</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 rounded-xl border-violet-200 hover:bg-violet-50 hover:border-violet-300 dark:border-violet-800 dark:hover:bg-violet-950/30 font-medium justify-center flex-col gap-1"
            onClick={() => onViewChange('fleet')}
          >
            <Building2 className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium">Location</span>
          </Button>
        </div>
      </motion.div>

      {/* Earnings Details */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.3 }}
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
                <Activity className="w-4 h-4 text-blue-600" />
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
