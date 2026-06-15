import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Car, CreditCard, Package, ShoppingBag, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, MapPin, Phone, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  item: UnifiedActivityItem | null;
  onOpenChange: (open: boolean) => void;
}

export const ActivityDetailsSheet = ({ open, item, onOpenChange }: Props) => {
  const navigate = useNavigate();
  
  if (!item) return null;

  const getIcon = () => {
    if (item.type === 'wallet_transfer') {
      const isReceived = item.title.includes('Reçu');
      return isReceived ? ArrowDownLeft : ArrowUpRight;
    }
    switch (item.type) {
      case 'transport': return Car;
      case 'delivery': return Package;
      case 'marketplace_purchase':
      case 'marketplace_sale': return ShoppingBag;
      case 'payment': return CreditCard;
      default: return Clock;
    }
  };

  const getIconStyle = () => {
    if (item.type === 'wallet_transfer') {
      const isReceived = item.title.includes('Reçu');
      return isReceived 
        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' 
        : 'bg-blue-50 dark:bg-blue-950/30 text-blue-500';
    }
    switch (item.type) {
      case 'transport': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-500';
      case 'delivery': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500';
      case 'marketplace_purchase': return 'bg-violet-50 dark:bg-violet-950/30 text-violet-500';
      case 'marketplace_sale': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-500';
      case 'payment': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-500';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  const IconComponent = getIcon();
  const isTransfer = item.type === 'wallet_transfer';
  const isReceived = isTransfer && item.title.includes('Reçu');

  const handleTrackDelivery = () => {
    const status = item.raw?.status;
    
    // Si commande annulée, informer l'utilisateur
    if (status === 'cancelled') {
      toast.info('Cette livraison a été annulée');
      return;
    }
    
    const deliveryId = item.raw?.id || item.raw?.delivery_order_id || item.raw?.order_id;
    
    if (!deliveryId) {
      toast.error('Impossible de suivre cette livraison');
      return;
    }
    
    onOpenChange(false);
    navigate(`/tracking/delivery/${deliveryId}`);
  };
  
  // Vérifier si on peut afficher le bouton de suivi
  const canTrackDelivery = item.type === 'delivery' && 
    item.raw?.status !== 'cancelled' && 
    item.raw?.status !== 'delivered';

  const handleContact = () => {
    if (item.type === 'delivery') {
      const driverPhone = item.raw?.driver_phone || item.raw?.chauffeur?.phone_number;
      if (driverPhone) {
        window.location.href = `tel:${driverPhone}`;
      } else {
        toast.info('Numéro du chauffeur non disponible');
      }
    }
    
    if (item.type === 'marketplace_purchase' || item.type === 'marketplace_sale') {
      const contactPhone = item.raw?.seller_phone || item.raw?.buyer_phone;
      if (contactPhone) {
        window.location.href = `tel:${contactPhone}`;
      } else {
        toast.info('Numéro de contact non disponible');
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconStyle()}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isTransfer ? (isReceived ? 'Transfert reçu' : 'Transfert envoyé') : item.title}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Montant principal */}
        {item.amount != null && (
          <div className="py-6 text-center border-y border-border/40">
            <div className={`text-3xl font-bold ${
              isTransfer && isReceived ? 'text-emerald-600' : 'text-foreground'
            }`}>
              {isTransfer && (isReceived ? '+' : '-')}{item.amount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {item.currency || 'CDF'}
            </div>
          </div>
        )}

        {/* Détails */}
        <div className="py-4 space-y-3">
          {/* Infos transfert */}
          {isTransfer && item.counterpartyName && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Contact</span>
              <span className="text-sm font-medium">{item.counterpartyName}</span>
            </div>
          )}

          {/* Statut */}
          {item.status && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Statut</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  ['completed', 'delivered', 'finished', 'success'].includes(item.status.toLowerCase()) 
                    ? 'bg-emerald-500' 
                    : ['cancelled', 'failed'].includes(item.status.toLowerCase())
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                }`} />
                <span className="text-sm font-medium capitalize">{item.status}</span>
              </div>
            </div>
          )}

          {/* Référence */}
          {item.raw?.id && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Référence</span>
              <span className="text-xs font-mono text-muted-foreground">
                {String(item.raw.id).slice(0, 8)}...
              </span>
            </div>
          )}

          {/* Soldes avant/après pour transferts */}
          {isTransfer && item.raw?.sender_balance_before != null && (
            <div className="mt-4 p-3 rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Solde avant</span>
                <span>{item.raw.sender_balance_before.toLocaleString()} {item.currency}</span>
              </div>
              {item.raw?.sender_balance_after != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Solde après</span>
                  <span className="font-medium">{item.raw.sender_balance_after.toLocaleString()} {item.currency}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-2">
          {canTrackDelivery && (
            <Button className="w-full" onClick={handleTrackDelivery}>
              <MapPin className="h-4 w-4 mr-2" />
              Suivre la livraison
            </Button>
          )}
          {(item.type === 'delivery' || item.type === 'marketplace_purchase' || item.type === 'marketplace_sale') && (
            <Button variant="outline" className="w-full" onClick={handleContact}>
              <Phone className="h-4 w-4 mr-2" />
              Contacter
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
