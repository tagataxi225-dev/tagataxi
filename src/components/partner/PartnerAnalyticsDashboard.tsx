import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign,
  Users,
  Car,
  Star,
  Target,
  Download,
  Clock,
  XCircle,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePartnerAnalytics } from '@/hooks/usePartnerAnalytics';
import { formatCurrencyCompact } from '@/utils/formatCurrency';

const kpiConfig = [
  { key: 'revenue', icon: DollarSign, label: 'Revenus', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'rides', icon: Car, label: 'Courses', iconBg: 'bg-blue-500/10 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'satisfaction', icon: Star, label: 'Satisfaction', iconBg: 'bg-amber-500/10 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'wallet', icon: Wallet, label: 'Portefeuille', iconBg: 'bg-purple-500/10 dark:bg-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400' },
] as const;

const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const PartnerAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const { data: analyticsData, isLoading: loading } = usePartnerAnalytics(timeRange);

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const kpiValues = analyticsData ? {
    revenue: `${formatCurrencyCompact(analyticsData.totalRevenue)} CDF`,
    rides: analyticsData.totalRides.toString(),
    satisfaction: `${analyticsData.satisfactionScore}/5`,
    wallet: `${formatCurrencyCompact(analyticsData.finances.walletBalance)} ${analyticsData.finances.walletCurrency}`,
  } : { revenue: '—', rides: '—', satisfaction: '—', wallet: '—' };

  const weeklyPerformance = analyticsData?.weeklyPerformance || [];
  const topDrivers = analyticsData?.topDrivers || [];
  const maxRides = Math.max(...weeklyPerformance.map(d => d.rides), 1);

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs px-3 h-7">7j</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-3 h-7">30j</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-3 h-7">Tout</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      {/* KPI Grid 2x2 */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        {kpiConfig.map(({ key, icon: Icon, label, iconBg, iconColor }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card border border-border/50 p-3.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`p-2 rounded-xl ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-foreground leading-tight">
              {kpiValues[key]}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs content */}
      <Tabs defaultValue="overview" className="space-y-3">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto gap-1 h-9">
            <TabsTrigger value="overview" className="text-xs px-3">Général</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs px-3">Finance</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs px-3">Perf.</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs px-3">Chauffeurs</TabsTrigger>
          </TabsList>
        </div>

        {/* === GENERAL === */}
        <TabsContent value="overview" className="space-y-3 mt-0">
          {/* Weekly Performance - Vertical bars */}
          <div className="rounded-2xl bg-muted/30 border border-border/30 p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Performance Hebdomadaire</p>
            {weeklyPerformance.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-28">
                {weeklyPerformance.map((day, i) => {
                  const pct = (day.rides / maxRides) * 100;
                  const barColor = day.efficiency >= 90 
                    ? 'bg-emerald-500' 
                    : day.efficiency >= 75 
                      ? 'bg-amber-500' 
                      : 'bg-destructive';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground font-medium">{day.rides}</span>
                      <div className="w-full flex justify-center">
                        <div 
                          className={`w-5 sm:w-7 rounded-t-lg ${barColor} transition-all duration-500`}
                          style={{ height: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{dayLabels[i] || day.day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">Aucune donnée</p>
            )}
          </div>

          {/* Objectives - Single compact block */}
          {analyticsData && (
            <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Objectifs</p>
              
              {[
                { icon: Target, label: 'Courses', current: analyticsData.monthlyGoal.current, target: analyticsData.monthlyGoal.target, pct: analyticsData.monthlyGoal.percentage },
                { icon: DollarSign, label: 'Revenus', current: formatCurrencyCompact(analyticsData.revenueGoal.current), target: formatCurrencyCompact(analyticsData.revenueGoal.target), pct: analyticsData.revenueGoal.percentage },
                { icon: Star, label: 'Satisfaction', current: analyticsData.satisfactionGoal.current, target: analyticsData.satisfactionGoal.target, pct: analyticsData.satisfactionGoal.percentage },
              ].map(({ icon: ObjIcon, label, current, target, pct }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <ObjIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold text-foreground">{current}/{target}</span>
                    </div>
                    <Progress 
                      value={pct} 
                      className={`h-1.5 ${pct >= 80 ? '[&>div]:bg-emerald-500' : pct >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === FINANCE === */}
        <TabsContent value="financial" className="mt-0">
          {analyticsData ? (
            <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Revenus totaux</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {analyticsData.totalRevenue.toLocaleString()} CDF
                </span>
              </div>
              <div className="h-px bg-border/50" />
              {[
                { label: 'Commissions', value: analyticsData.finances.totalCommissions },
                { label: 'Retraits', value: analyticsData.finances.totalWithdrawn },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value.toLocaleString()} CDF</span>
                </div>
              ))}
              <div className="h-px bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Disponible</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {analyticsData.finances.availableForWithdrawal.toLocaleString()} CDF
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-6">Chargement…</p>
          )}
        </TabsContent>

        {/* === PERFORMANCE === */}
        <TabsContent value="performance" className="mt-0">
          <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-4">
            {[
              { icon: Clock, label: 'Temps de réponse', value: `${analyticsData?.performanceMetrics.avgResponseTime || 0} min`, status: (analyticsData?.performanceMetrics.avgResponseTime || 0) <= 3 ? 'good' : (analyticsData?.performanceMetrics.avgResponseTime || 0) <= 5 ? 'warn' : 'bad' },
              { icon: XCircle, label: 'Taux d\'annulation', value: `${analyticsData?.performanceMetrics.cancellationRate || 0}%`, status: (analyticsData?.performanceMetrics.cancellationRate || 0) <= 5 ? 'good' : (analyticsData?.performanceMetrics.cancellationRate || 0) <= 10 ? 'warn' : 'bad' },
              { icon: CheckCircle2, label: 'Efficacité', value: `${analyticsData?.performanceMetrics.operationalEfficiency || 0}%`, status: (analyticsData?.performanceMetrics.operationalEfficiency || 0) >= 80 ? 'good' : 'warn', showBar: analyticsData?.performanceMetrics.operationalEfficiency || 0 },
            ].map(({ icon: PIcon, label, value, status, showBar }, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PIcon className={`h-4 w-4 ${status === 'good' ? 'text-emerald-500' : status === 'warn' ? 'text-amber-500' : 'text-destructive'}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{value}</span>
                    <span className="text-[10px]">{status === 'good' ? '✅' : status === 'warn' ? '⚠️' : '🔴'}</span>
                  </div>
                </div>
                {showBar !== undefined && (
                  <Progress 
                    value={showBar} 
                    className={`h-1.5 mt-2 ${showBar >= 80 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
                  />
                )}
                {i < 2 && <div className="h-px bg-border/30 mt-3" />}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* === CHAUFFEURS === */}
        <TabsContent value="drivers" className="mt-0">
          <div className="rounded-2xl bg-card border border-border/50 p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Top Chauffeurs</p>
            {topDrivers.length > 0 ? (
              <div className="space-y-2.5">
                {topDrivers.map((driver, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{driver.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span>{driver.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{driver.rides} courses</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {formatCurrencyCompact(driver.revenue)} CDF
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">Aucun chauffeur actif</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
