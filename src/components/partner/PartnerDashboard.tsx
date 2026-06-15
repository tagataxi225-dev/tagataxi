import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Car, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Star,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { usePartnerActivity } from '@/hooks/usePartnerActivity';
import { PartnerEarningsCard } from './PartnerEarningsCard';
import { PartnerRideCommissions } from './PartnerRideCommissions';
import { motion } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

interface PartnerDashboardProps {
  onViewChange: (view: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onViewChange }) => {
  const { stats, loading: statsLoading } = usePartnerStats();
  const { activities, loading: activitiesLoading } = usePartnerActivity();

  const quickActions: QuickAction[] = [
    {
      id: 'add-driver',
      label: 'Ajouter Chauffeur',
      icon: Users,
      color: 'text-blue-600',
      onClick: () => onViewChange('drivers')
    },
    {
      id: 'add-vehicle',
      label: 'Nouveau Véhicule',
      icon: Car,
      color: 'text-green-600',
      onClick: () => onViewChange('vehicles')
    },
    {
      id: 'subscription-earnings',
      label: 'Gains Abonnements',
      icon: DollarSign,
      color: 'text-purple-600',
      onClick: () => onViewChange('subscription-earnings')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'text-orange-600',
      onClick: () => onViewChange('analytics')
    }
  ];

  const getPerformanceIndicator = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    return {
      percentage: Math.min(percentage, 100),
      status: percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : 'needs-improvement',
      color: percentage >= 90 ? 'text-green-600' : percentage >= 70 ? 'text-blue-600' : 'text-orange-600'
    };
  };

  const recentAlerts = activities?.slice(0, 3).map((activity, index) => ({
    id: index + 1,
    type: 'info' as const,
    message: activity.description,
    time: '2h'
  })) || [];

  if (statsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">Bonjour, Partenaire !</h1>
        <p className="text-primary-foreground/80">Voici un aperçu de vos performances aujourd'hui</p>
        <div className="flex items-center mt-4 gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Temps réel</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-sm">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickActions.map((action) => (
          <Card 
            key={action.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            onClick={action.onClick}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              <action.icon className={`h-8 w-8 ${action.color} mb-2`} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDrivers || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Total dans la flotte
            </div>
            <Progress 
              value={getPerformanceIndicator(stats?.activeDrivers || 0, 20).percentage} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses en Cours</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ongoingRides || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 mr-1 text-blue-600" />
              En temps réel
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">Système actif</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Aujourd'hui</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyRevenue?.toLocaleString() || '0'} CDF</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-1 text-primary" />
              Commissions 12%
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => onViewChange('commissions')}
            >
              Voir détails
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats?.averageRating || 'N/A'}</div>
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            </div>
            <div className="text-xs text-muted-foreground">
              Basé sur {stats?.totalReviews || 0} avis
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {(stats?.averageRating || 0) >= 4.5 ? '⭐ Excellent' : (stats?.averageRating || 0) >= 3.5 ? '👍 Bon' : '📈 À améliorer'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earnings Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <PartnerEarningsCard range="7d" />
      </motion.div>

      {/* Ride Commissions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <PartnerRideCommissions />
      </motion.div>

      {/* Recent Activity & Alerts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">Il y a {activity.time}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="h-2 w-2 rounded-full mt-2 bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">il y a {alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Aperçu des Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Efficacité Opérationnelle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Efficacité Opérationnelle</p>
                  <span className={`text-sm font-bold ${(stats?.operationalEfficiency || 0) >= 90 ? 'text-green-600' : (stats?.operationalEfficiency || 0) >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>{stats?.operationalEfficiency || 0}%</span>
                </div>
                <Progress value={stats?.operationalEfficiency || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">{(stats?.operationalEfficiency || 0) >= 90 ? 'Excellent' : (stats?.operationalEfficiency || 0) >= 70 ? 'Bon' : 'À améliorer'}</p>
              </div>

              {/* Taux de Satisfaction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Taux de Satisfaction</p>
                  <span className={`text-sm font-bold ${(stats?.satisfactionRate || 0) >= 90 ? 'text-green-600' : (stats?.satisfactionRate || 0) >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>{stats?.satisfactionRate || 0}%</span>
                </div>
                <Progress value={stats?.satisfactionRate || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">{(stats?.satisfactionRate || 0) >= 90 ? 'Excellent' : (stats?.satisfactionRate || 0) >= 70 ? 'Bon' : 'À améliorer'}</p>
              </div>

              {/* Utilisation Flotte */}
              {(() => {
                const fleetUtil = stats?.totalFleet ? Math.round((stats.activeDrivers / stats.totalFleet) * 100) : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Utilisation Flotte</p>
                      <span className={`text-sm font-bold ${fleetUtil >= 90 ? 'text-green-600' : fleetUtil >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>{fleetUtil}%</span>
                    </div>
                    <Progress value={fleetUtil} className="h-2" />
                    <p className="text-xs text-muted-foreground">{fleetUtil >= 90 ? 'Excellent' : fleetUtil >= 70 ? 'Bon' : 'À améliorer'}</p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};