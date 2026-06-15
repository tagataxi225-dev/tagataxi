import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, ShoppingBag, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useVendorStats } from '@/hooks/useVendorStats';
import { VendorSetupProgress } from './VendorSetupProgress';
import { StatsCompactCard } from './modern/StatsCompactCard';
import { StaggerContainer, StaggerItem } from './animations';

interface VendorDashboardOverviewProps {
  onTabChange?: (tab: string) => void;
}

export const VendorDashboardOverview = ({ onTabChange }: VendorDashboardOverviewProps) => {
  const navigate = useNavigate();
  const { stats, loading } = useVendorStats();

  const handleSetupAction = (action: string) => {
    switch (action) {
      case 'profile':
        onTabChange?.('profile');
        break;
      case 'add-product':
        navigate('/vendeur/ajouter-produit');
        break;
      case 'subscription':
        onTabChange?.('subscription');
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {/* KPIs Skeleton avec shimmer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="h-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        {/* Actions Skeleton */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="h-12 bg-muted/60 rounded animate-pulse" />
          <div className="h-12 bg-muted/60 rounded animate-pulse" />
        </div>
        {/* Config Skeleton */}
        <div className="h-16 bg-muted/60 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {/* 1. KPI Cards - Avec stagger animation */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StaggerItem>
          <StatsCompactCard
            icon={CheckCircle}
            label="Actifs"
            value={stats.activeProducts}
            color="green"
            onClick={() => onTabChange?.('shop')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCompactCard
            icon={Clock}
            label="En attente"
            value={stats.pendingProducts}
            color="orange"
            onClick={() => onTabChange?.('shop')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCompactCard
            icon={ShoppingBag}
            label="Commandes"
            value={stats.totalOrders}
            color="blue"
            badge={stats.pendingOrders}
            onClick={() => onTabChange?.('orders')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCompactCard
            icon={DollarSign}
            label="Escrow"
            value={`${stats.pendingEscrow.toLocaleString()} CDF`}
            color="yellow"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* 2. Quick Actions - Avec animation d'entrée */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="grid grid-cols-2 gap-2 sm:gap-3"
      >
        <Button 
          onClick={() => navigate('/vendeur/ajouter-produit')} 
          className="h-12 quick-action-btn transition-transform hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onTabChange?.('shop')} 
          className="h-12 quick-action-btn transition-transform hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          <Package className="h-5 w-5 mr-2" />
          Gérer
        </Button>
      </motion.div>

      {/* 3. Configuration - Avec animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <VendorSetupProgress onActionClick={handleSetupAction} />
      </motion.div>

      {/* 4. Alertes contextuelles - Avec animation de reveal */}
      {stats.pendingOrders > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
        >
          <Alert variant="default" className="border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-sm font-semibold">Commandes à traiter</AlertTitle>
            <AlertDescription className="text-xs">
              Vous avez {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} en attente de validation.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {stats.pendingProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-sm font-semibold">Produits en modération</AlertTitle>
            <AlertDescription className="text-xs">
              {stats.pendingProducts} produit{stats.pendingProducts > 1 ? 's' : ''} en attente d'approbation.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};
