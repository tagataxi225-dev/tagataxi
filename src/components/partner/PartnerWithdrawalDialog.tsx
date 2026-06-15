import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPartnerCurrency } from '@/lib/partnerUtils';

interface PartnerWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSubmit: (amount: number, method: string, accountDetails: any) => Promise<void>;
  loading?: boolean;
}

export const PartnerWithdrawalDialog = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSubmit,
  loading = false
}: PartnerWithdrawalDialogProps) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'orange_money' | 'm_pesa' | 'airtel_money' | 'bank_transfer'>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');

  const minWithdrawal = 50000; // 50,000 CDF minimum
  const feePercentage = 2; // 2% fees

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');
  };

  const calculateFees = () => {
    const amountNum = parseFloat(amount) || 0;
    return amountNum * (feePercentage / 100);
  };

  const calculateNetAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    return amountNum - calculateFees();
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum < minWithdrawal) {
      setError(`Le montant minimum est de ${formatPartnerCurrency(minWithdrawal, currency)}`);
      return;
    }

    if (amountNum > availableBalance) {
      setError('Solde insuffisant');
      return;
    }

    if (!phoneNumber && method !== 'bank_transfer') {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!accountName) {
      setError('Veuillez entrer le nom du bénéficiaire');
      return;
    }

    try {
      await onSubmit(amountNum, method, {
        phone_number: phoneNumber,
        account_name: accountName,
        method
      });

      // Reset form
      setAmount('');
      setPhoneNumber('');
      setAccountName('');
      setError('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Demande de retrait</DialogTitle>
          <DialogDescription>
            Retirez vos gains vers votre compte Mobile Money ou bancaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Balance */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Solde disponible</p>
            <p className="text-2xl font-bold text-primary">
              {formatPartnerCurrency(availableBalance, currency)}
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à retirer</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 100000"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min={minWithdrawal}
              max={availableBalance}
            />
            <p className="text-xs text-muted-foreground">
              Minimum: {formatPartnerCurrency(minWithdrawal, currency)}
            </p>
          </div>

          {/* Withdrawal Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Méthode de retrait</Label>
            <Select value={method} onValueChange={(value: any) => setMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="m_pesa">M-Pesa</SelectItem>
                <SelectItem value="airtel_money">Airtel Money</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="account_name">Nom du bénéficiaire</Label>
            <Input
              id="account_name"
              type="text"
              placeholder="Ex: Jean Mukendi"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          {/* Phone Number (for Mobile Money) */}
          {method !== 'bank_transfer' && (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +243 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          {/* Fee Summary */}
          {amount && parseFloat(amount) >= minWithdrawal && (
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Montant demandé</span>
                <span className="font-medium">{formatPartnerCurrency(parseFloat(amount), currency)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Frais ({feePercentage}%)</span>
                <span className="font-medium">- {formatPartnerCurrency(calculateFees(), currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Vous recevrez</span>
                <span className="text-green-600">{formatPartnerCurrency(calculateNetAmount(), currency)}</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !amount || parseFloat(amount) < minWithdrawal}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le retrait
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
