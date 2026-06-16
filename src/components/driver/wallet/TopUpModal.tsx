/**
 * 💰 Modal de recharge TembeaPay
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import airtelMoneyLogo from '@/assets/airtel-money-logo.png';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';
import mpesaLogo from '@/assets/mpesa-logo.png';
import { cityDetectionService } from '@/services/cityDetectionService';
import { getCityOrDefault } from '@/config/coveredCities';

function getPhonePrefix() {
  const selected = cityDetectionService.getSelectedCity();
  const cityName = selected?.name
    ?? (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan' ? 'Abidjan' : 'Kinshasa');
  const isAbidjan = getCityOrDefault(cityName) === 'Abidjan';
  return isAbidjan
    ? { prefix: '+225', flag: '🇨🇮', currency: 'XOF', minAmount: 200 }
    : { prefix: '+243', flag: '🇨🇩', currency: 'XOF', minAmount: 1000 };
}

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PROVIDERS = [
  { id: 'airtel', name: 'Airtel Money', logo: airtelMoneyLogo },
  { id: 'orange', name: 'Orange Money', logo: orangeMoneyLogo },
  { id: 'mpesa', name: 'M-Pesa', logo: mpesaLogo }
];

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export const TopUpModal = ({ open, onOpenChange, onSuccess }: TopUpModalProps) => {
  const { toast } = useToast();
  const phoneInfo = getPhonePrefix();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleTopUp = async () => {
    const parsedAmount = parseInt(amount);

    if (!parsedAmount || parsedAmount < phoneInfo.minAmount) {
      toast({
        title: "Montant invalide",
        description: `Le montant minimum est de ${phoneInfo.minAmount.toLocaleString('fr-FR')} ${phoneInfo.currency}`,
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          amount: parsedAmount,
          provider,
          phone: `${phoneInfo.prefix}${phoneNumber}`,
          currency: phoneInfo.currency
        }
      });

      if (error) throw error;

      toast({
        title: "Recharge initiée",
        description: `${parsedAmount.toLocaleString('fr-FR')} ${phoneInfo.currency} - Confirmez sur votre téléphone`,
      });

      onSuccess();
      onOpenChange(false);

      // Reset form
      setAmount('');
      setPhoneNumber('');
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast({
        title: "Erreur de recharge",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Recharger mon wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Montant */}
          <div className="space-y-3">
            <Label>Montant ({phoneInfo.currency})</Label>
            <Input
              type="number"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={phoneInfo.minAmount}
              step={phoneInfo.minAmount}
            />
            
            {/* Montants prédéfinis */}
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  {preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-3">
            <Label>Moyen de paiement</Label>
            <RadioGroup value={provider} onValueChange={setProvider}>
              {PROVIDERS.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent"
                  onClick={() => setProvider(p.id)}
                >
                  <RadioGroupItem value={p.id} id={p.id} />
                  <Label htmlFor={p.id} className="flex items-center gap-2 cursor-pointer flex-1">
                    <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain" />
                    <span className="font-medium">{p.name}</span>
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-3">
            <Label>Numéro de téléphone</Label>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 px-3 border rounded-l-md bg-muted text-sm">
                <span>{phoneInfo.flag}</span>
                <span>{phoneInfo.prefix}</span>
              </span>
              <Input
                type="tel"
                placeholder="812345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={9}
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Un code de confirmation sera envoyé sur ce numéro
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleTopUp}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Confirmer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
