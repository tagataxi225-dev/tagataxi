import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Car, Package, ShoppingBag, CreditCard, Clock, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ===== Traduction des statuts =====
const statusLabels: Record<string, string> = {
  cancelled: 'Annulé',
  completed: 'Terminé',
  delivered: 'Livré',
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  processing: 'Traitement',
  driver_assigned: 'Chauffeur assigné',
  picked_up: 'Récupéré',
  failed: 'Échoué',
  rejected: 'Rejeté',
  finished: 'Terminé',
  success: 'Réussi',
};

// ===== Traduction des types de véhicule =====
const vehicleLabels: Record<string, string> = {
  taxi_moto: 'Taxi Moto',
  taxi_confort: 'Taxi Confort',
  taxi_bus: 'Taxi Bus',
  vtc_prive: 'VTC Privé',
  eco: 'Éco',
  moto: 'Moto',
  standard: 'Standard',
  premium: 'Premium',
};

interface ModernActivityItemProps {
  item: UnifiedActivityItem;
  onClick?: (item: UnifiedActivityItem) => void;
}

export const ModernActivityItem = ({ item, onClick }: ModernActivityItemProps) => {
  const getTypeConfig = () => {
    switch (item.type) {
      case 'transport':
        return { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500', label: 'Transport' };
      case 'delivery':
        return { icon: Package, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500', label: 'Livraison' };
      case 'marketplace_purchase':
        return { icon: ShoppingBag, bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500', label: 'Achat' };
      case 'marketplace_sale':
        return { icon: ShoppingBag, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500', label: 'Vente' };
      case 'payment':
        return { icon: CreditCard, bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500', label: 'Paiement' };
      case 'wallet_transfer':
        const isReceived = item.title.includes('Reçu');
        return { 
          icon: isReceived ? ArrowDownLeft : ArrowUpRight, 
          bg: isReceived ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-blue-50 dark:bg-blue-950/30', 
          iconColor: isReceived ? 'text-emerald-500' : 'text-blue-500',
          label: isReceived ? 'Reçu' : 'Envoyé'
        };
      default:
        return { icon: Clock, bg: 'bg-muted/50', iconColor: 'text-muted-foreground', label: 'Activité' };
    }
  };

  const getStatusConfig = () => {
    if (!item.status) return null;
    const status = item.status.toLowerCase();
    const label = statusLabels[status] || item.status;

    if (['completed', 'delivered', 'finished', 'success'].includes(status)) {
      return { color: 'bg-emerald-500', text: label };
    }
    if (['in_progress', 'processing', 'driver_assigned', 'picked_up'].includes(status)) {
      return { color: 'bg-amber-500', text: label };
    }
    if (['pending', 'confirmed'].includes(status)) {
      return { color: 'bg-blue-500', text: label };
    }
    if (['cancelled', 'failed', 'rejected'].includes(status)) {
      return { color: 'bg-red-500', text: label };
    }
    return { color: 'bg-muted-foreground', text: label };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
    return amount.toLocaleString();
  };

  // Extraire le type de véhicule traduit depuis raw data
  const getVehicleLabel = (): string | null => {
    const raw = item.raw;
    if (!raw) return null;
    const vType = raw.vehicle_type || raw.delivery_type;
    if (!vType) return null;
    return vehicleLabels[vType.toLowerCase()] || vType;
  };

  const config = getTypeConfig();
  const statusConfig = getStatusConfig();
  const IconComponent = config.icon;
  const isTransfer = item.type === 'wallet_transfer';
  const isReceived = isTransfer && item.title.includes('Reçu');
  const vehicleLabel = getVehicleLabel();
  const hasAmount = item.amount != null && item.amount > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        className="cursor-pointer bg-card border-border/30 shadow-sm hover:shadow-md transition-shadow duration-200"
        onClick={() => onClick?.(item)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icône pastel */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
              <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-foreground text-sm line-clamp-1">
                  {isTransfer ? (item.counterpartyName || 'Contact') : item.title}
                </h3>
                {/* Statut traduit avec pastille */}
                {statusConfig && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {statusConfig.text}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                {vehicleLabel && (
                  <>
                    <span className="text-xs text-muted-foreground">{vehicleLabel}</span>
                    <span className="text-muted-foreground/50">•</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            </div>

            {/* Montant (masqué si null) + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAmount && (
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    isTransfer 
                      ? isReceived ? 'text-emerald-600' : 'text-foreground'
                      : 'text-foreground'
                  }`}>
                    {isTransfer && (isReceived ? '+' : '-')}
                    {formatAmount(item.amount!)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.currency || 'XOF'}
                  </div>
                </div>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
