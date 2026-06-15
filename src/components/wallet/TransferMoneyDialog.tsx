import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useRecipientValidation } from '@/hooks/useRecipientValidation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Send, 
  X, 
  User, 
  CheckCircle2, 
  XCircle, 
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransferMoneyDialogProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export const TransferMoneyDialog = ({ open, onClose }: TransferMoneyDialogProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { wallet, loading, transferFunds } = useWallet();
  const { user } = useAuth();
  const { recipientInfo, isValidating, error, validateRecipient, clearValidation } = useRecipientValidation();

  // Récupérer les contacts récents
  const { data: recentContacts } = useQuery({
    queryKey: ['recent-transfer-contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: transfers } = await supabase
        .from('wallet_transfers')
        .select('recipient_id, created_at')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!transfers || transfers.length === 0) return [];
      
      const uniqueRecipients = Array.from(
        new Map(transfers.map(t => [t.recipient_id, t])).values()
      ).slice(0, 5);
      
      const recipientIds = uniqueRecipients.map(t => t.recipient_id);
      const { data: clients } = await supabase
        .from('clients')
        .select('user_id, display_name, phone_number, email')
        .in('user_id', recipientIds);
      
      return uniqueRecipients
        .map(transfer => {
          const clientInfo = clients?.find(c => c.user_id === transfer.recipient_id);
          return clientInfo ? {
            recipient_id: transfer.recipient_id,
            display_name: clientInfo.display_name,
            phone_number: clientInfo.phone_number,
            email: clientInfo.email
          } : null;
        })
        .filter(c => c && c.display_name);
    },
    enabled: open && !!user?.id
  });

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    if (value.trim().length >= 3) {
      validateRecipient(value);
    } else {
      clearValidation();
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !recipientInfo?.valid) return;
    
    try {
      await transferFunds(recipient, parseFloat(amount), description);
      setRecipient('');
      setAmount('');
      setDescription('');
      clearValidation();
      onClose();
    } catch (error) {
      console.error('Erreur transfert:', error);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setDescription('');
    clearValidation();
    onClose();
  };

  const amountValue = parseFloat(amount) || 0;
  const isAmountValid = amountValue >= 100 && amountValue <= 500000;
  const isAmountTooLow = amountValue > 0 && amountValue < 100;
  const isAmountTooHigh = amountValue > 500000;
  
  const isValid = 
    recipient.trim() !== '' && 
    recipientInfo?.valid === true &&
    isAmountValid;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent className="max-h-[92vh] rounded-t-2xl">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-t-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Transfert en cours...</p>
            </div>
          </div>
        )}

        <DrawerHeader className="px-5 pb-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold text-foreground">
              Transférer
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-5 pb-6 pt-4 space-y-5 overflow-y-auto">
          {/* Solde - ligne simple */}
          <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Solde disponible</span>
            <span className="text-base font-bold text-foreground">
              {wallet?.balance.toLocaleString()} CDF
            </span>
          </div>

          {/* Info discrète */}
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Seul le solde principal est transférable (pas les crédits écosystème).
            </p>
          </div>

          {/* Contacts récents */}
          {recentContacts && recentContacts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Contacts récents
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {recentContacts.map((contact: any) => (
                  <button
                    key={contact.recipient_id}
                    type="button"
                    onClick={() => handleRecipientChange(contact.email || contact.phone_number || '')}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-3 h-3 text-muted-foreground" />
                    {contact.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input destinataire */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Destinataire
            </Label>
            <div className="relative">
              <Input
                placeholder="Numéro de téléphone ou email"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className="h-12 pr-10 rounded-xl bg-muted/30 border-border/60 focus-visible:ring-primary/30"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {recipientInfo?.valid && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {error && !isValidating && <XCircle className="w-5 h-5 text-destructive" />}
              </div>
            </div>

            {/* Destinataire validé */}
            {recipientInfo?.valid && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                    {recipientInfo.display_name}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {recipientInfo.phone_number}
                  </p>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && !isValidating && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Téléphone ou email du destinataire Tembea
            </p>
          </div>

          {/* Input montant */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Montant (CDF)
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "h-12 text-xl font-bold text-center rounded-xl bg-muted/30 border-border/60 focus-visible:ring-primary/30",
                isAmountTooLow && "border-amber-400",
                isAmountTooHigh && "border-destructive"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={isAmountTooLow ? "text-amber-600 font-medium" : ""}>
                Min: 100 CDF
              </span>
              <span className={isAmountTooHigh ? "text-destructive font-medium" : ""}>
                Max: 500,000 CDF
              </span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(String(qa))}
                className={cn(
                  "py-2 rounded-xl text-sm font-semibold transition-colors",
                  String(qa) === amount
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/50 text-foreground hover:bg-muted"
                )}
              >
                {qa.toLocaleString('fr-CD')}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Description (optionnel)
            </Label>
            <Input
              placeholder="Ex: Remboursement, Cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl bg-muted/30 border-border/60 focus-visible:ring-primary/30"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-medium"
            >
              Annuler
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading || !isValid}
              className="flex-1 h-12 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Transfert...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
