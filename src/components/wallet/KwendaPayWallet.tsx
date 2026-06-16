import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
interface WalletData {
  id: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  payment_method?: string;
  created_at: string;
  balance_after: number;
}

export const KwendaPayWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpProvider, setTopUpProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const providers = [
    { id: 'airtel', name: 'Airtel Money', icon: '📱' },
    { id: 'orange', name: 'Orange Money', icon: '🧡' },
    { id: 'mpesa', name: 'M-Pesa', icon: '💚' }
  ];

  useEffect(() => {
    if (user) {
      loadWallet();
      loadTransactions();
    }
  }, [user]);

  const loadWallet = async () => {
    console.log('💰 [TembeaPay] Loading wallet for user:', user?.id);
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`💰 [TembeaPay] Attempt ${retryCount + 1}/${maxRetries + 1} to load wallet`);
        const { data: existingWallet, error: walletError } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (walletError && walletError.code === 'PGRST116') {
          console.log('💰 [TembeaPay] Wallet not found, creating new wallet');
          // Create wallet if it doesn't exist
          const { data: newWallet, error: createError } = await supabase
            .from('user_wallets')
            .insert({ 
              user_id: user?.id, 
              balance: 0,
              currency: 'XOF',
              is_active: true
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ [TembeaPay] Error creating wallet:', createError);
            throw createError;
          }
          console.log('✅ [TembeaPay] New wallet created:', newWallet);
          setWallet(newWallet);
        } else if (walletError) {
          console.error('❌ [TembeaPay] Error loading wallet:', walletError);
          throw walletError;
        } else {
          console.log('✅ [TembeaPay] Wallet loaded successfully:', existingWallet);
          setWallet(existingWallet);
        }
        
        return; // Success, exit retry loop
        
      } catch (error: any) {
        retryCount++;
        
        if (retryCount <= maxRetries) {
          console.warn(`🔄 Wallet load retry ${retryCount}/${maxRetries}:`, error);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        } else {
          console.error('Error loading wallet:', error);
          toast({
            title: "Erreur de connexion",
            description: "Impossible de charger le portefeuille. Vérifiez votre connexion.",
            variant: "destructive"
          });
        }
      }
    }
    
    setLoading(false);
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleTopUp = async () => {
    console.log('💳 [TembeaPay] Starting top-up process');
    if (!topUpAmount || !topUpProvider || !phoneNumber) {
      console.warn('⚠️ [TembeaPay] Missing required fields for top-up');
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    console.log('💳 [TembeaPay] Top-up details:', {
      amount: topUpAmount,
      provider: topUpProvider,
      phone: phoneNumber.substring(0, 4) + '***' // Masquer le numéro
    });

    setIsProcessing(true);
    try {
      // Récupérer la session utilisateur pour l'authentification
      console.log('🔐 [TembeaPay] Fetching user session');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ [TembeaPay] No active session found');
        throw new Error('Authentification requise pour recharger votre wallet');
      }

      console.log('✅ [TembeaPay] Session found, calling wallet-topup edge function');
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          amount: parseFloat(topUpAmount),
          provider: topUpProvider,
          phone: phoneNumber,
          currency: 'XOF'
        }
      });

      console.log('📥 [TembeaPay] Edge function response:', { success: data?.success, error });

      if (error) {
        console.error('❌ [TembeaPay] Edge function returned error:', error);
        throw error;
      }

      if (data.success) {
        console.log('✅ [TembeaPay] Top-up successful:', {
          transactionId: data.transactionId,
          amount: topUpAmount
        });
        toast({
          title: "Rechargement réussi",
          description: `Votre wallet a été rechargé de ${topUpAmount} CDF`
        });
        setIsTopUpOpen(false);
        setTopUpAmount('');
        setPhoneNumber('');
        setTopUpProvider('');
        loadWallet();
        loadTransactions();
      } else {
        console.error('❌ [TembeaPay] Top-up failed:', data.error);
        throw new Error(data.error || 'Echec du rechargement');
      }
    } catch (error: any) {
      console.error('❌ [TembeaPay] Top-up process error:', error);
      toast({
        title: "Erreur de rechargement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      console.log('💳 [TembeaPay] Top-up process ended');
    }
  };

  const formatAmount = (amount: number) => formatCurrency(amount, 'XOF');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                Chargement de votre portefeuille
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        <CardContent className="relative pt-8 pb-6 px-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                Solde disponible
              </p>
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {formatAmount(wallet?.balance || 0)}
              </p>
            </div>
            
            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Recharger mon compte
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    💳 Recharger votre compte
                  </DialogTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ajoutez des fonds via Mobile Money
                  </p>
                </DialogHeader>
                
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Montant (CDF)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="10000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="h-12 text-lg border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="provider" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Opérateur Mobile Money
                    </Label>
                    <Select value={topUpProvider} onValueChange={setTopUpProvider}>
                      <SelectTrigger className="h-12 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Choisir un opérateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <span className="flex items-center gap-2 text-base">
                              <span className="text-xl">{provider.icon}</span>
                              {provider.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Numéro de téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+243 XXX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-12 text-lg border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleTopUp} 
                    disabled={isProcessing}
                    className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Confirmer le rechargement
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="recent" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <TabsTrigger 
                value="recent"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                Récentes
              </TabsTrigger>
              <TabsTrigger 
                value="all"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                Toutes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-3 mt-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Aucune transaction
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Vos transactions apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="group flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'credit' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(transaction.created_at).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.transaction_type === 'credit' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </p>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {getStatusIcon(transaction.status)}
                          <span className={`text-xs font-medium capitalize ${
                            transaction.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400'
                              : transaction.status === 'failed'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {transaction.status === 'completed' ? 'Réussi' : 
                             transaction.status === 'failed' ? 'Échoué' : 'En cours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-2 mt-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Aucune transaction
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="group flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'credit' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(transaction.created_at).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {transaction.payment_method && (
                              <span className="ml-2 text-slate-400">• {transaction.payment_method}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.transaction_type === 'credit' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </p>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {getStatusIcon(transaction.status)}
                          <span className={`text-xs font-medium capitalize ${
                            transaction.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400'
                              : transaction.status === 'failed'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {transaction.status === 'completed' ? 'Réussi' : 
                             transaction.status === 'failed' ? 'Échoué' : 'En cours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};