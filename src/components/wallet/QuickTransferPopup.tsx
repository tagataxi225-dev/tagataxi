import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, Loader2, Search, CheckCircle2, User } from 'lucide-react';
import { Drawer } from 'vaul';
import { useWallet } from '@/hooks/useWallet';
import { useRecentContacts } from '@/hooks/useRecentContacts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ContactCard } from './ContactCard';
import { SuccessConfetti } from './SuccessConfetti';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/utils/edgeFunctionWrapper';
import '@/styles/quick-transfer.css';

const generateAvatarColor = (userId: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface QuickTransferPopupProps {
  open: boolean;
  onClose: () => void;
  onTransferSuccess?: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export const QuickTransferPopup: React.FC<QuickTransferPopupProps> = ({
  open,
  onClose,
  onTransferSuccess
}) => {
  const { toast } = useToast();
  const { wallet, transferFunds } = useWallet();
  const { contacts, loading: loadingContacts, refreshContacts } = useRecentContacts();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (query.trim().length < 3) {
      setSearchResult(null);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await invokeEdgeFunction({
          functionName: 'validate-transfer-recipient',
          body: { identifier: query.trim() }
        });
        
        if (error) throw error;
        
        if (data?.valid && data?.recipientId) {
          setSearchResult({
            user_id: data.recipientId,
            display_name: data.recipientName || 'Utilisateur',
            identifier: query.trim(),
            avatar_color: generateAvatarColor(data.recipientId),
          });
        } else {
          setSearchResult(null);
          toast({
            title: 'Introuvable',
            description: 'Aucun utilisateur trouvé avec cet identifiant',
            variant: 'destructive'
          });
        }
      } catch (err: any) {
        setSearchResult(null);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  }, [toast]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const selectContact = (userId: string, name: string) => {
    setSelectedContact(userId);
    setSelectedContactName(name);
  };

  const handleTransfer = async () => {
    if (!selectedContact || (!selectedAmount && !customAmount)) {
      toast({ title: 'Sélection incomplète', description: 'Choisissez un contact et un montant', variant: 'destructive' });
      return;
    }

    const amount = selectedAmount || parseFloat(customAmount);
    
    if (amount < 100 || amount > 500000) {
      toast({ title: 'Montant invalide', description: 'Entre 100 et 500 000 CDF', variant: 'destructive' });
      return;
    }

    if (!wallet || wallet.balance < amount) {
      toast({ title: 'Solde insuffisant', description: `Disponible: ${wallet?.balance?.toLocaleString() || 0} CDF`, variant: 'destructive' });
      return;
    }

    setIsTransferring(true);

    try {
      await transferFunds(selectedContact, amount, 'Transfert rapide');
      setShowConfetti(true);
      toast({ title: '✨ Transfert réussi !', description: `${amount.toLocaleString()} CDF envoyés à ${selectedContactName}` });

      setTimeout(() => {
        onTransferSuccess?.();
        onClose();
        setSelectedContact(null);
        setSelectedContactName(null);
        setSelectedAmount(null);
        setCustomAmount('');
        setShowConfetti(false);
        setSearchQuery('');
        setSearchResult(null);
      }, 2000);
    } catch (error: any) {
      toast({ title: 'Erreur de transfert', description: error.message || 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!open) return null;

  const renderContent = () => (
    <>
      {/* Balance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="wallet-glass p-3 rounded-2xl border border-border/30">
        <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
        <p className="text-xl font-bold text-foreground">
          {wallet?.balance?.toLocaleString() || '0'} <span className="text-base text-muted-foreground">CDF</span>
        </p>
      </motion.div>

      {/* Search bar — TOUJOURS visible */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Rechercher un destinataire</h3>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Email ou numéro de téléphone..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>

        {/* Search result */}
        {searchResult && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => selectContact(searchResult.user_id, searchResult.display_name)}
            className={`mt-2 w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              selectedContact === searchResult.user_id
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-muted/30 border border-border/30 hover:bg-muted/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: searchResult.avatar_color }}>
              {searchResult.display_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{searchResult.display_name}</p>
              <p className="text-xs text-muted-foreground truncate">{searchResult.identifier}</p>
            </div>
            {selectedContact === searchResult.user_id && (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            )}
          </motion.button>
        )}
      </div>

      {/* Selected contact banner */}
      {selectedContact && selectedContactName && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <User className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground truncate">
            Envoyer à <span className="text-primary font-bold">{selectedContactName}</span>
          </p>
          <button onClick={() => { setSelectedContact(null); setSelectedContactName(null); }}
            className="ml-auto p-1 rounded-full hover:bg-muted/50">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </motion.div>
      )}

      {/* Recent contacts */}
      {contacts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Contacts récents</h3>
          <div className="grid grid-cols-3 gap-2">
            {contacts.slice(0, 6).map((contact, index) => (
              <motion.div key={contact.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}>
                <ContactCard
                  contact={contact}
                  selected={selectedContact === contact.user_id}
                  onClick={() => selectContact(contact.user_id, contact.display_name)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Amounts */}
      {selectedContact && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Montant</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((amount, index) => (
              <motion.button key={amount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                className={`p-3 rounded-xl font-semibold text-base transition-all ${
                  selectedAmount === amount
                    ? 'contact-selected bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white'
                    : 'bg-muted/50 hover:bg-muted text-foreground hover:scale-105'
                }`}>
                {amount.toLocaleString()} CDF
              </motion.button>
            ))}
          </div>
          <div className="mt-3">
            <input type="number" placeholder="Autre montant..."
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </motion.div>
      )}

      {/* Transfer button */}
      {selectedContact && (selectedAmount || customAmount) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <button onClick={handleTransfer} disabled={isTransferring}
            className="w-full quick-transfer-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isTransferring ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Transfert en cours...</>
            ) : (
              <>Envoyer {(selectedAmount || parseFloat(customAmount) || 0).toLocaleString()} CDF<ArrowRight className="h-5 w-5" /></>
            )}
          </button>
        </motion.div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer.Root open={open} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-background via-background to-muted/20 rounded-t-3xl shadow-2xl border-t border-border/50 outline-none">
              <div className="absolute inset-0 quick-transfer-gradient opacity-5 pointer-events-none rounded-t-3xl" />
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/60 mt-4 mb-2" />
              <div className="relative px-4 pb-3 border-b border-border/30">
                <button onClick={onClose} className="absolute top-0 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">Transfert Rapide</h2>
                    <p className="text-xs text-muted-foreground">Envoyez instantanément</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 space-y-4 max-h-[75vh] overflow-y-auto scroll-smooth pb-safe-or-4">
                {renderContent()}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <SuccessConfetti show={showConfetti} />
      </>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-50">
            <div className="relative bg-gradient-to-br from-background via-background to-muted/20 rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              <div className="absolute inset-0 quick-transfer-gradient opacity-5 pointer-events-none" />
              <div className="relative p-6 pb-4 border-b border-border/30">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">Transfert Rapide</h2>
                    <p className="text-sm text-muted-foreground">Envoyez instantanément</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scroll-smooth">
                {renderContent()}
              </div>
            </div>
          </motion.div>
          <SuccessConfetti show={showConfetti} />
        </>
      )}
    </AnimatePresence>
  );
};
