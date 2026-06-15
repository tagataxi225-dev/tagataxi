import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Loader2, Smartphone, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MobileMoneyPaymentProps {
  amount: number;
  currency?: string;
  orderId?: string;
  orderType?: 'transport' | 'delivery' | 'marketplace';
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

const MobileMoneyPayment = ({ amount, currency = "CDF", orderId, orderType, onSuccess, onCancel }: MobileMoneyPaymentProps) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
  const { toast } = useToast();

  const providers = [
    {
      id: 'airtel',
      name: 'Airtel Money',
      color: 'bg-red-500',
      description: 'Paiement via Airtel Money',
      disabled: true,
      badge: 'Bientôt'
    },
    {
      id: 'orange',
      name: 'Orange Money',
      color: 'bg-orange-500',
      description: 'Paiement via Orange Money',
      disabled: false,
      badge: null
    },
    {
      id: 'mpesa',
      name: 'M-Pesa',
      color: 'bg-green-600',
      description: 'Paiement via M-Pesa',
      disabled: true,
      badge: 'Bientôt'
    }
  ];

  const handlePayment = async () => {
    if (!selectedProvider || !phoneNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un opérateur et saisir votre numéro",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          amount,
          provider: selectedProvider,
          phoneNumber,
          currency,
          orderId,
          orderType
        }
      });

      if (error) throw error;

      if (data.success) {
        setStep('success');
        toast({
          title: "Paiement réussi",
          description: data.message,
        });
        
        setTimeout(() => {
          onSuccess(data.transactionId);
        }, 2000);
      } else {
        throw new Error(data.message || 'Erreur de paiement');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStep('select');
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur s'est produite lors du paiement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency === 'CDF' ? 'CDF' : 'USD',
      minimumFractionDigits: currency === 'CDF' ? 0 : 2,
    }).format(amount);
  };

  // Success state
  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700">Paiement réussi !</h3>
            <p className="text-muted-foreground">Votre paiement de {formatAmount(amount, currency)} a été traité avec succès.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Traitement en cours...</h3>
            <p className="text-muted-foreground">
              Nous traitons votre paiement via {providers.find(p => p.id === selectedProvider)?.name}
            </p>
            <div className="text-sm text-muted-foreground">
              Cela peut prendre quelques secondes...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main payment form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-center mb-6">Paiement Mobile Money</h2>
          <div className="text-center mb-6">
            <p className="text-lg font-semibold">Montant à payer</p>
            <p className="text-3xl font-bold text-primary">{formatAmount(amount, currency)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">Choisissez votre opérateur</Label>
          <RadioGroup 
            value={selectedProvider} 
            onValueChange={setSelectedProvider}
            className="space-y-3"
          >
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center space-x-3">
                <RadioGroupItem 
                  value={provider.id} 
                  id={provider.id}
                  disabled={provider.disabled}
                  className="mt-1"
                />
                <Label 
                  htmlFor={provider.id}
                  className={cn(
                    "flex-1",
                    provider.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className={`w-12 h-12 rounded-full ${provider.color} flex items-center justify-center`}>
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-base">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                    <Badge 
                      variant={provider.disabled ? "secondary" : "default"}
                      className={provider.disabled 
                        ? "bg-yellow-500 text-black font-bold" 
                        : "bg-green-100 text-green-700"
                      }
                    >
                      {provider.disabled ? provider.badge : 'Disponible'}
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base font-semibold">
            Numéro de téléphone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+243 XXX XXX XXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-base h-12"
          />
          <p className="text-sm text-muted-foreground">
            Saisissez le numéro associé à votre compte Mobile Money
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            <strong>Paiement sécurisé</strong> - Vos données sont protégées et chiffrées
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 h-12"
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button 
            onClick={handlePayment}
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
            disabled={!selectedProvider || !phoneNumber || isProcessing}
          >
            {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileMoneyPayment;