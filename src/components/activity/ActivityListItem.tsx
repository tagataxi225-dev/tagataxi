import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Card } from '@/components/ui/card';
import { CreditCard, Package, ShoppingBag, Car, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconByType: Record<UnifiedActivityItem['type'], React.ReactNode> = {
  transport: <Car className="h-4 w-4" />,
  delivery: <Package className="h-4 w-4" />,
  marketplace_purchase: <ShoppingBag className="h-4 w-4" />,
  marketplace_sale: <ShoppingBag className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  wallet_transfer: <ArrowLeftRight className="h-4 w-4" />,
};

const labelKeyByType: Record<UnifiedActivityItem['type'], string> = {
  transport: 'activity.type.transport',
  delivery: 'activity.type.delivery',
  marketplace_purchase: 'activity.type.purchase',
  marketplace_sale: 'activity.type.sale',
  payment: 'activity.type.payment',
  wallet_transfer: 'activity.type.transfer',
};

interface ActivityListItemProps {
  item: UnifiedActivityItem;
  onClick?: (item: UnifiedActivityItem) => void;
}

export const ActivityListItem = ({ item, onClick }: ActivityListItemProps) => {
  const { t } = useLanguage();
  const label = t(labelKeyByType[item.type]);
  const amountText = item.amount != null ? `${item.amount.toLocaleString()} ${item.currency || 'CDF'}` : undefined;

  return (
    <Card 
      role="button"
      onClick={() => onClick?.(item)}
      className="border border-border/50 shadow-sm p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
          {iconByType[item.type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{item.title}</p>
            {amountText && <p className="text-sm font-semibold text-card-foreground ml-2">{amountText}</p>}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{label} • {item.subtitle || item.status}</span>
            <span>{new Date(item.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
