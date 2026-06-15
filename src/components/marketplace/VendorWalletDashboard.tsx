import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowDownRight, ArrowUpRight, CreditCard, Phone, TrendingUp, Clock, DollarSign, Plus } from 'lucide-react';
import { UnifiedTopUpModal } from '@/components/wallet/UnifiedTopUpModal';
import { useMerchantAccount } from '@/hooks/useMerchantAccount';

interface WithdrawalFormData {
  amount: string;
  withdrawal_method: 'orange_money' | 'm_pesa' | 'airtel_money' | '';
  phone_number: string;
}

export const VendorWalletDashboard: React.FC = () => {
  const { merchantAccount, transactions, loading, withdrawing, requestWithdrawal, formatAmount, refetch } = useMerchantAccount();
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormData>({
    amount: '',
    withdrawal_method: '',
    phone_number: ''
  });
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);

  const handleWithdrawal = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.withdrawal_method || !withdrawalForm.phone_number) {
      return;
    }

    try {
      await requestWithdrawal({
        amount: parseFloat(withdrawalForm.amount),
        withdrawal_method: withdrawalForm.withdrawal_method as 'orange_money' | 'm_pesa' | 'airtel_money',
        phone_number: withdrawalForm.phone_number
      });
      
      setWithdrawalForm({ amount: '', withdrawal_method: '', phone_number: '' });
      setIsWithdrawDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'debit':
      case 'withdrawal':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compte Marchand</h1>
          <p className="text-muted-foreground">Gérez vos gains de vente et vos retraits</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsTopUpDialogOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Recharger
          </Button>
          <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Phone className="mr-2 h-4 w-4" />
                Retirer via Mobile Money
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Demande de retrait</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Montant (CDF)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 50000"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Solde disponible: {formatAmount(merchantAccount?.balance || 0)} CDF
                </p>
              </div>
              
              <div>
                <Label htmlFor="method">Méthode de retrait</Label>
                <Select value={withdrawalForm.withdrawal_method} onValueChange={(value) => 
                  setWithdrawalForm(prev => ({ ...prev, withdrawal_method: value as any }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="m_pesa">M-Pesa</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: +243901234567"
                  value={withdrawalForm.phone_number}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Frais:</strong> 2% du montant<br/>
                  <strong>Montant net:</strong> {withdrawalForm.amount ? 
                    formatAmount(parseFloat(withdrawalForm.amount) * 0.98) : '0 CDF'}
                </p>
              </div>
              
              <Button 
                onClick={handleWithdrawal}
                disabled={withdrawing || !withdrawalForm.amount || !withdrawalForm.withdrawal_method || !withdrawalForm.phone_number || !merchantAccount?.balance || merchantAccount.balance <= 0}
                className="w-full"
              >
                {withdrawing ? 'Traitement...' : 'Confirmer le retrait'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Solde disponible</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatAmount(merchantAccount?.balance || 0)} CDF
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Compte marchand - retirable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total gagné</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatAmount(merchantAccount?.total_earned || 0)} CDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ArrowDownRight className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Total retiré</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatAmount(merchantAccount?.total_withdrawn || 0)} CDF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Historique des transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="credit">Crédits</TabsTrigger>
              <TabsTrigger value="withdrawal">Retraits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune transaction trouvée
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status === 'completed' ? 'Terminé' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="credit" className="space-y-4 mt-4">
              <div className="space-y-2">
                {transactions.filter(t => t.transaction_type === 'credit').map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +{formatAmount(transaction.amount)}
                      </p>
                      <Badge variant="default">Terminé</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="withdrawal" className="space-y-4 mt-4">
              <div className="space-y-2">
                {transactions.filter(t => t.transaction_type === 'withdrawal').map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        -{formatAmount(transaction.amount)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status === 'completed' ? 'Terminé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top-Up Modal */}
      <UnifiedTopUpModal
        open={isTopUpDialogOpen}
        onClose={() => setIsTopUpDialogOpen(false)}
        userType="vendor"
        walletBalance={merchantAccount?.balance || 0}
        currency="CDF"
        onSuccess={() => {
          refetch();
          setIsTopUpDialogOpen(false);
        }}
      />
    </div>
  );
};