import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import type { POSTransactionItem } from '@/hooks/usePOSTransactions';
import type { POSSession } from '@/hooks/usePOSSession';

interface POSCartProps {
  cart: POSTransactionItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: (paymentMethod: 'cash' | 'card' | 'mobile_money' | 'kwenda_pay') => void;
  session: POSSession;
}

export const POSCart = ({ cart, onUpdateQuantity, onCheckout, session }: POSCartProps) => {
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'mobile_money' | 'kwenda_pay'>('cash');

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // À implémenter si nécessaire
  const total = subtotal + tax;

  const paymentMethods = [
    { id: 'cash' as const, label: 'Espèces', icon: Banknote },
    { id: 'card' as const, label: 'Carte', icon: CreditCard },
    { id: 'mobile_money' as const, label: 'Mobile Money', icon: Smartphone },
    { id: 'kwenda_pay' as const, label: 'TembeaPay', icon: Wallet },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Session Info */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Session</span>
          <Badge variant="outline">{new Date(session.opened_at).toLocaleTimeString()}</Badge>
        </div>
      </div>

      {/* Cart Items - CORRECTION: max-h-0 force le scroll */}
      <ScrollArea className="flex-1 max-h-0 p-4 no-overscroll">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="bg-card border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} CDF</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.product_id, 0)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-bold">{item.total.toLocaleString()} CDF</span>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Panier vide</p>
              <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Totals */}
      {cart.length > 0 && (
        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{subtotal.toLocaleString()} CDF</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span>{tax.toLocaleString()} CDF</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{total.toLocaleString()} CDF</span>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Button
                  key={method.id}
                  variant={selectedPayment === method.id ? 'default' : 'outline'}
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Checkout Button */}
          <Button
            onClick={() => onCheckout(selectedPayment)}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="lg"
          >
            Encaisser {total.toLocaleString()} CDF
          </Button>
        </div>
      )}
    </div>
  );
};
