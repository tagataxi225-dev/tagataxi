import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Phone, CreditCard } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSuccess: () => void;
}

export const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('kwenda_pay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawalAmount = parseFloat(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Le montant dépasse votre solde disponible",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Numéro requis",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'process_withdrawal',
          confirmationData: {
            userId: user.id,
            amount: withdrawalAmount,
            withdrawalMethod,
            paymentDetails: {
              userType: 'seller', // À adapter selon le contexte
              kwendaPayPhone: withdrawalMethod === 'kwenda_pay' ? phoneNumber : null,
              mobileMoneyProvider: withdrawalMethod === 'mobile_money' ? mobileProvider : null,
              mobileMoneyPhone: withdrawalMethod === 'mobile_money' ? phoneNumber : null
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Demande soumise",
        description: "Votre demande de retrait est en cours de traitement"
      });

      onSuccess();
      resetForm();

    } catch (error: any) {
      console.error('Erreur retrait:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la demande de retrait",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPhoneNumber('');
    setMobileProvider('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Retirer des fonds
          </DialogTitle>
          <DialogDescription>
            Solde disponible: {availableBalance.toLocaleString()} CDF
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à retirer (CDF)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Saisir le montant"
              min="1"
              max={availableBalance}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Méthode de retrait</Label>
            <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kwenda_pay">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    TAGAPay
                  </div>
                </SelectItem>
                <SelectItem value="mobile_money">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Mobile Money
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {withdrawalMethod === 'mobile_money' && (
            <div className="space-y-2">
              <Label htmlFor="provider">Opérateur</Label>
              <Select value={mobileProvider} onValueChange={setMobileProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  <SelectItem value="m_pesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">
              {withdrawalMethod === 'kwenda_pay' ? 'Numéro TAGAPay' : 'Numéro Mobile Money'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+243 XX XXX XXXX"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Traitement...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};