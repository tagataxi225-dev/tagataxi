import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wallet, Phone, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { VendorEarningsStats } from './VendorEarningsStats';

interface VendorEarning {
  id: string;
  amount: number;
  status: string;
  earnings_type: string;
  created_at: string;
  order_id: string;
}

interface VendorWithdrawal {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  fees: number;
  net_amount: number;
  requested_at: string;
  processed_at?: string;
  transaction_reference?: string;
}

export const VendorWithdrawalInterface: React.FC = () => {
  const [earnings, setEarnings] = useState<VendorEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [provider, setProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les gains et retraits
  useEffect(() => {
    if (user) {
      loadEarnings();
      loadWithdrawals();
    }
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Temporary mock data since vendor_earnings table is not in types yet
      const mockEarnings: VendorEarning[] = [
        {
          id: '1',
          amount: 15000,
          status: 'available',
          earnings_type: 'delivery_sale',
          created_at: new Date().toISOString(),
          order_id: 'order-1'
        },
        {
          id: '2',
          amount: 8500,
          status: 'available',
          earnings_type: 'marketplace_sale',
          created_at: new Date().toISOString(),
          order_id: 'order-2'
        }
      ];
      
      setEarnings(mockEarnings);
      
      // Calculer le solde disponible
      const available = mockEarnings.filter(e => e.status === 'available')
        .reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setAvailableBalance(available);
    } catch (error: any) {
      console.error('Error loading earnings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les gains",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    if (!user) return;

    try {
      // Temporary mock data since vendor_withdrawals table is not in types yet
      const mockWithdrawals: VendorWithdrawal[] = [];
      setWithdrawals(mockWithdrawals);
    } catch (error: any) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || !provider || !phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > availableBalance) {
      toast({
        title: "Erreur",
        description: "Montant invalide",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-withdrawal', {
        body: {
          amount: amount,
          paymentMethod: 'mobile_money',
          paymentDetails: {
            provider: provider,
            phoneNumber: phoneNumber
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Retrait effectué",
          description: `${formatCurrency(data.netAmount)} transféré avec succès`,
        });
        
        // Réinitialiser le formulaire
        setWithdrawAmount('');
        setProvider('');
        setPhoneNumber('');
        
        // Recharger les données
        loadEarnings();
        loadWithdrawals();
      } else {
        throw new Error(data.message || 'Échec du retrait');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec du retrait",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Complété</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      case 'available':
        return <Badge variant="default">Disponible</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Retiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Mes Retraits</h1>
      </div>

      {/* Statistiques de revenus avec commission */}
      {user && <VendorEarningsStats vendorId={user.id} />}

      {/* Solde disponible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Solde Disponible pour Retrait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(availableBalance)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Montant net après déduction de commission (disponible immédiatement)
          </p>
        </CardContent>
      </Card>

      {/* Formulaire de retrait */}
      <Card>
        <CardHeader>
          <CardTitle>Demander un retrait</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à retirer</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Montant en CDF"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              max={availableBalance}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Frais de retrait: 1% (minimum 500 CDF) • Maximum disponible: {formatCurrency(availableBalance)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              💡 Commission déjà déduite - vous recevez 100% de ce montant (moins frais de retrait)
            </p>
          </div>

          <div>
            <Label htmlFor="provider">Opérateur mobile</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir l'opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airtel">Airtel Money</SelectItem>
                <SelectItem value="orange">Orange Money</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+243 XXX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <Button
            onClick={handleWithdrawal}
            disabled={submitting || availableBalance <= 0}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Traitement...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Effectuer le retrait
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Historique des retraits */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des retraits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun retrait effectué
              </p>
            ) : (
              withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{formatCurrency(withdrawal.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(withdrawal.requested_at).toLocaleDateString('fr-FR')}
                    </div>
                    {withdrawal.transaction_reference && (
                      <div className="text-xs text-muted-foreground">
                        Réf: {withdrawal.transaction_reference}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    <div className="text-sm text-muted-foreground mt-1">
                      Net: {formatCurrency(withdrawal.net_amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historique des gains */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des gains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {earnings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun gain enregistré
              </p>
            ) : (
              earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{formatCurrency(earning.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {earning.earnings_type} • {new Date(earning.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {getStatusBadge(earning.status)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorWithdrawalInterface;