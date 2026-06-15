import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { usePOSSession, POSSession } from '@/hooks/usePOSSession';
import { usePOSTransactions } from '@/hooks/usePOSTransactions';
import { useToast } from '@/hooks/use-toast';

interface POSSessionCloseProps {
  session: POSSession;
  restaurantId: string;
  onClose: () => void;
  onCancel: () => void;
}

export const POSSessionClose = ({ session, restaurantId, onClose, onCancel }: POSSessionCloseProps) => {
  const { toast } = useToast();
  const { closeSession, loading } = usePOSSession();
  const { getSessionTransactions } = usePOSTransactions();
  
  const [closingCash, setClosingCash] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [salesByMethod, setSalesByMethod] = useState({
    cash: 0,
    card: 0,
    mobile_money: 0,
    kwenda_pay: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [session.id]);

  const loadTransactions = async () => {
    const txs = await getSessionTransactions(session.id);
    setTransactions(txs);

    // Calculate sales by payment method
    const byMethod = {
      cash: 0,
      card: 0,
      mobile_money: 0,
      kwenda_pay: 0,
    };

    txs.forEach((tx: any) => {
      if (tx.payment_method in byMethod) {
        byMethod[tx.payment_method as keyof typeof byMethod] += tx.total_amount;
      }
    });

    setSalesByMethod(byMethod);
  };

  const expectedCash = session.opening_cash + salesByMethod.cash;
  const closingCashNum = parseFloat(closingCash) || 0;
  const difference = closingCashNum - expectedCash;
  const totalSales = Object.values(salesByMethod).reduce((a, b) => a + b, 0);

  const handleClose = async () => {
    if (!closingCash) {
      toast({
        title: 'Montant requis',
        description: 'Veuillez saisir le montant de caisse physique',
        variant: 'destructive',
      });
      return;
    }

    const result = await closeSession(session.id, closingCashNum);
    if (result) {
      onClose();
    }
  };

  const paymentMethodIcons = {
    cash: Banknote,
    card: CreditCard,
    mobile_money: Smartphone,
    kwenda_pay: Wallet,
  };

  const paymentMethodLabels = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    kwenda_pay: 'TembeaPay',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6 text-orange-500" />
            Fermeture de caisse
          </h1>
          <p className="text-muted-foreground">Session #{session.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Récapitulatif de la session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Fond de caisse</p>
              <p className="text-xl font-bold">{session.opening_cash.toLocaleString()} CDF</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Ventes espèces</p>
              <p className="text-xl font-bold text-green-600">+{salesByMethod.cash.toLocaleString()} CDF</p>
            </div>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Attendu en caisse</span>
              </div>
              <span className="text-2xl font-bold">{expectedCash.toLocaleString()} CDF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Count Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comptage physique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closing-cash">Montant compté en caisse (CDF)</Label>
            <Input
              id="closing-cash"
              type="number"
              placeholder="Saisissez le montant..."
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="text-lg h-12"
            />
          </div>

          {closingCash && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-center justify-between ${
                difference === 0 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : difference > 0
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {difference === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className={`h-5 w-5 ${difference > 0 ? 'text-blue-600' : 'text-red-600'}`} />
                )}
                <span className="font-medium">
                  {difference === 0 
                    ? 'Caisse équilibrée' 
                    : difference > 0 
                      ? 'Excédent de caisse'
                      : 'Manquant en caisse'}
                </span>
              </div>
              <Badge variant={difference === 0 ? 'outline' : difference > 0 ? 'default' : 'destructive'}>
                {difference > 0 ? '+' : ''}{difference.toLocaleString()} CDF
              </Badge>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail par mode de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(salesByMethod).map(([method, amount]) => {
              const Icon = paymentMethodIcons[method as keyof typeof paymentMethodIcons];
              const label = paymentMethodLabels[method as keyof typeof paymentMethodLabels];
              const count = transactions.filter(t => t.payment_method === method).length;
              
              return (
                <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{count} transaction{count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold">{amount.toLocaleString()} CDF</span>
                </div>
              );
            })}

            <Separator />

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
              <span className="font-bold">Total des ventes</span>
              <span className="text-xl font-bold">{totalSales.toLocaleString()} CDF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          onClick={handleClose}
          disabled={loading || !closingCash}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          Confirmer la fermeture
        </Button>
      </div>
    </div>
  );
};
