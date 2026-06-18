import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Loader2, Smartphone, Shield, CreditCard, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  currency: string;
  onPayment: (data: {
    provider: string;
    phoneNumber: string;
    autoRenew: boolean;
  }) => Promise<void>;
  isProcessing: boolean;
}

const providers = [
  {
    id: 'airtel',
    name: 'Airtel Money',
    icon: '🔴',
    color: 'bg-red-500',
    description: 'Paiement instantané',
    fees: '0%'
  },
  {
    id: 'orange',
    name: 'Orange Money',
    icon: '🟠',
    color: 'bg-orange-500',
    description: 'Rapide et sécurisé',
    fees: '0%'
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '🟢',
    color: 'bg-green-600',
    description: 'Service fiable',
    fees: '0%'
  }
];

export const ModernPaymentDialog = ({
  isOpen,
  onClose,
  planName,
  amount,
  currency,
  onPayment,
  isProcessing
}: PaymentDialogProps) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedProvider || !phoneNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un opérateur et saisir votre numéro",
        variant: "destructive",
      });
      return;
    }

    if (phoneNumber.length < 10) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez saisir un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');
    
    try {
      await onPayment({
        provider: selectedProvider,
        phoneNumber,
        autoRenew
      });
      setStep('success');
    } catch (error) {
      setStep('error');
      setErrorMessage(error.message || 'Une erreur est survenue');
    }
  };

  const resetDialog = () => {
    setStep('form');
    setSelectedProvider('');
    setPhoneNumber('');
    setAutoRenew(true);
    setErrorMessage('');
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const formatPhoneNumber = (value: string) => {
    // Supprimer tous les caractères non numériques sauf le +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Si commence par +243, formatter
    if (cleaned.startsWith('+243')) {
      const number = cleaned.substring(4);
      if (number.length <= 9) {
        return `+243 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 9)}`.trim();
      }
    }
    
    // Si commence par 243, ajouter le +
    if (cleaned.startsWith('243')) {
      const number = cleaned.substring(3);
      if (number.length <= 9) {
        return `+243 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 9)}`.trim();
      }
    }
    
    // Si commence par 0, remplacer par +243
    if (cleaned.startsWith('0')) {
      const number = cleaned.substring(1);
      if (number.length <= 9) {
        return `+243 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 9)}`.trim();
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Success state
  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-success">Paiement réussi !</h3>
              <p className="text-muted-foreground">
                Votre abonnement <strong>{planName}</strong> est maintenant actif.
              </p>
              <p className="text-sm text-muted-foreground">
                Votre véhicule est désormais visible sur l'application TAGA.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-destructive">Paiement échoué</h3>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                Réessayer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}} modal>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Traitement en cours...</h3>
              <p className="text-muted-foreground">
                Nous traitons votre paiement via {providers.find(p => p.id === selectedProvider)?.name}
              </p>
              <div className="text-sm text-muted-foreground">
                Cela peut prendre quelques secondes...
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              Transaction sécurisée
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main form
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Paiement d'abonnement</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-base">
            Abonnement <strong>{planName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé de la commande */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-3xl font-bold text-primary">
                    {amount.toLocaleString()} CDF
                  </p>
                  <p className="text-sm text-muted-foreground">Par mois</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className="bg-success text-success-foreground">
                    Sans frais
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Aucun frais de transaction
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sélection de l'opérateur */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Choisissez votre opérateur</Label>
            <RadioGroup 
              value={selectedProvider} 
              onValueChange={setSelectedProvider}
              className="grid gap-3"
            >
              {providers.map((provider) => (
                <div key={provider.id}>
                  <RadioGroupItem 
                    value={provider.id} 
                    id={provider.id}
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={provider.id}
                    className="cursor-pointer"
                  >
                    <Card className={`transition-all ${
                      selectedProvider === provider.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'hover:border-primary/50 hover:bg-accent/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${provider.color} flex items-center justify-center text-white text-xl`}>
                            {provider.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">{provider.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Disponible
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Frais: {provider.fees}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            selectedProvider === provider.id 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground'
                          }`}>
                            {selectedProvider === provider.id && (
                              <CheckCircle className="w-3 h-3 text-white m-0.5" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-lg font-semibold">
              Numéro de téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+243 XXX XXX XXX"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="text-lg h-14 pl-4"
            />
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Numéro associé à votre compte Mobile Money
            </p>
          </div>

          {/* Renouvellement automatique */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Renouvellement automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Votre abonnement sera automatiquement renouvelé chaque mois
                  </p>
                </div>
                <Switch
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations de sécurité */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800">
                    Paiement 100% sécurisé
                  </p>
                  <p className="text-xs text-blue-700">
                    Vos données bancaires sont chiffrées et protégées selon les standards internationaux
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 h-12"
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 h-12 bg-primary hover:bg-primary/90"
              disabled={!selectedProvider || !phoneNumber || isProcessing}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Confirmer le paiement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};