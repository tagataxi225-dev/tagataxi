import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWalletPayment } from '@/hooks/useWalletPayment';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Package } from 'lucide-react';

interface DeliveryPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  currency: string;
  pickup: string;
  destination: string;
  onPaymentComplete: () => void;
}

export default function DeliveryPaymentModal({
  open, onOpenChange, orderId, amount, currency, pickup, destination, onPaymentComplete
}: DeliveryPaymentModalProps) {
  const { payWithWallet } = useWalletPayment();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    if (!user?.id) {
      toast.error('Vous devez \u00eatre connect\u00e9 pour payer');
      return;
    }
    setPaying(true);
    try {
      const result = await payWithWallet(
        user.id,
        amount,
        'Livraison: ' + pickup + ' \u2192 ' + destination,
        'delivery_order',
        orderId,
      );
      if (!result.success) {
        toast.error('Paiement \u00e9chou\u00e9', { description: result.error || 'Solde insuffisant' });
        return;
      }
      await supabase.from('delivery_orders').update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      }).eq('id', orderId);
      setPaid(true);
      toast.success('Paiement effectu\u00e9 !');
      setTimeout(() => { onPaymentComplete(); }, 1500);
    } catch (err: any) {
      toast.error('Erreur de paiement', { description: err.message });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {paid ? <CheckCircle className="h-7 w-7 text-green-500" /> : <Package className="h-7 w-7 text-primary" />}
            </div>
          </div>
          <DialogTitle className="text-center">
            {paid ? 'Paiement confirm\u00e9' : 'Payer la livraison'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="text-sm text-muted-foreground text-center">{pickup} \u2192 {destination}</div>
          <div className="text-2xl font-bold text-center text-primary">
            {amount.toLocaleString()} {currency}
          </div>
        </div>
        {!paid && (
          <Button onClick={handlePay} disabled={paying} className="w-full mt-2">
            {paying ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Paiement en cours...</>
            ) : (
              'Payer ' + amount.toLocaleString() + ' ' + currency
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
