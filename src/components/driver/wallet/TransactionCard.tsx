/**
 * 💳 Carte de transaction contextualisée
 */

import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Car, Package, ShoppingBag, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TransactionCardProps {
  transaction: any;
  serviceType: 'taxi' | 'delivery';
}

export const TransactionCard = ({ transaction, serviceType }: TransactionCardProps) => {
  // Détection robuste des crédits (transferts reçus, recharges, bonus, etc.)
  const isCredit = ['credit', 'transfer_in', 'top_up', 'refund', 'bonus'].includes(transaction.transaction_type);
  const amount = transaction.amount;

  const getIcon = () => {
    if (transaction.reference_type === 'taxi') {
      return <Car className="w-4 h-4" />;
    } else if (transaction.reference_type === 'delivery') {
      return <Package className="w-4 h-4" />;
    } else if (transaction.reference_type === 'marketplace') {
      return <ShoppingBag className="w-4 h-4" />;
    }
    
    // Détection des transferts pour icônes personnalisées
    const description = transaction.description?.toLowerCase() || '';
    if (description.includes('transfert envoyé')) {
      return <Send className="w-4 h-4" />;
    }
    if (description.includes('transfert reçu')) {
      return <Download className="w-4 h-4" />;
    }
    
    return isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />;
  };

  const getDescription = () => {
    if (transaction.reference_type === 'taxi') {
      return `Course #${transaction.reference_id?.slice(0, 8)}`;
    } else if (transaction.reference_type === 'delivery') {
      return `Livraison #${transaction.reference_id?.slice(0, 8)}`;
    } else if (transaction.reference_type === 'marketplace') {
      return `Livraison Marketplace #${transaction.reference_id?.slice(0, 8)}`;
    }
    return transaction.description || 'Transaction';
  };

  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${isCredit ? serviceColor : 'red'}-500/10 flex items-center justify-center text-${isCredit ? serviceColor : 'red'}-500`}>
            {getIcon()}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {getDescription()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold text-lg ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
            {isCredit ? '+' : '-'}{amount.toLocaleString()} CDF
          </p>
          {transaction.status && (
            <p className="text-xs text-muted-foreground capitalize">
              {transaction.status}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
