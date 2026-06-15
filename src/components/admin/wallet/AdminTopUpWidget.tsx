import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, Search, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface UserSearchResult {
  id: string;
  display_name: string;
  email: string;
  phone_number: string;
  user_type: string;
  wallet_balance?: number;
  wallet_currency?: string;
}

export const AdminTopUpWidget = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Search in clients, chauffeurs, and partners
      const { data: clients } = await supabase
        .from('clients')
        .select('id, display_name, email, phone_number, user_id')
        .or(`email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(5);

      const { data: drivers } = await supabase
        .from('chauffeurs')
        .select('id, display_name, email, phone_number, user_id')
        .or(`email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(5);

      const results: UserSearchResult[] = [];
      
      if (clients) {
        for (const client of clients) {
          const { data: wallet } = await supabase
            .from('user_wallets')
            .select('balance, currency')
            .eq('user_id', client.user_id)
            .single();

          results.push({
            id: client.user_id,
            display_name: client.display_name,
            email: client.email,
            phone_number: client.phone_number,
            user_type: 'Client',
            wallet_balance: wallet?.balance || 0,
            wallet_currency: wallet?.currency || 'CDF'
          });
        }
      }

      if (drivers) {
        for (const driver of drivers) {
          const { data: wallet } = await supabase
            .from('user_wallets')
            .select('balance, currency')
            .eq('user_id', driver.user_id)
            .single();

          results.push({
            id: driver.user_id,
            display_name: driver.display_name,
            email: driver.email,
            phone_number: driver.phone_number,
            user_type: 'Chauffeur',
            wallet_balance: wallet?.balance || 0,
            wallet_currency: wallet?.currency || 'CDF'
          });
        }
      }

      setSearchResults(results);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedUser || !amount || !reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Log admin action in activity_logs
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'admin_wallet_topup',
        description: `Recharge de ${parseFloat(amount)} ${selectedUser.wallet_currency} pour ${selectedUser.display_name}`,
        amount: parseFloat(amount),
        currency: selectedUser.wallet_currency,
        reference_id: selectedUser.id,
        reference_type: 'wallet_topup',
        metadata: { reason, target_user: selectedUser.email }
      });

      // Update wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', selectedUser.id)
        .single();

      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({ balance: wallet.balance + parseFloat(amount) })
          .eq('id', wallet.id);

        // Create transaction record in activity_logs
        await supabase.from('activity_logs').insert({
          user_id: selectedUser.id,
          activity_type: 'wallet_topup',
          description: `Recharge admin: ${reason}`,
          amount: parseFloat(amount),
          currency: selectedUser.wallet_currency,
          reference_type: 'admin_topup',
          metadata: {
            admin_id: user.id,
            reason,
            balance_before: wallet.balance,
            balance_after: wallet.balance + parseFloat(amount)
          }
        });
      }

      toast.success('Recharge effectuée avec succès');
      setSelectedUser(null);
      setAmount('');
      setReason('');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      toast.error('Erreur lors de la recharge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Recharges Wallet</h1>
          <p className="text-muted-foreground">Gérer les recharges de portefeuilles utilisateurs</p>
        </div>
      </div>

      {!selectedUser ? (
        <Card>
          <CardHeader>
            <CardTitle>Rechercher un utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Email ou numéro de téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{user.display_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone_number}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{user.user_type}</Badge>
                        <p className="text-lg font-bold mt-2">
                          {user.wallet_balance?.toLocaleString()} {user.wallet_currency}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recharger le portefeuille</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">{selectedUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Badge>{selectedUser.user_type}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {selectedUser.wallet_balance?.toLocaleString()} {selectedUser.wallet_currency}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant à créditer</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de la recharge</Label>
              <Input
                id="reason"
                placeholder="Ex: Compensation service, Promotion..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-600">Attention</p>
                <p className="text-muted-foreground">
                  Cette action sera enregistrée dans les logs d'audit. 
                  Assurez-vous de la validité de cette recharge.
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleTopUp}
              className="w-full h-12"
              disabled={!amount || !reason || loading}
            >
              {loading ? (
                'Traitement...'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmer la recharge
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
