import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, CreditCard, Smartphone, Building } from 'lucide-react';
import { usePartnerWithdrawals } from '@/hooks/usePartnerWithdrawals';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency as formatCurrencyUtil } from '@/utils/formatCurrency';
export const CommissionWithdrawal = () => {
  const { withdrawals, stats, loading, requestWithdrawal, cancelWithdrawal } = usePartnerWithdrawals();
  const isMobile = useIsMobile();
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    paymentMethod: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    phoneNumber: ''
  });

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, 'CDF');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'paid': return 'Payé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'paid': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'airtel_money':
      case 'orange_money':
      case 'mpesa':
        return <Smartphone className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'airtel_money': return 'Airtel Money';
      case 'orange_money': return 'Orange Money';
      case 'mpesa': return 'M-Pesa';
      case 'bank_transfer': return 'Virement Bancaire';
      case 'cash': return 'Espèces';
      default: return method;
    }
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalData.amount);
    if (!amount || amount <= 0 || !withdrawalData.paymentMethod) return;

    let accountDetails: any = {};
    
    if (['airtel_money', 'orange_money', 'mpesa'].includes(withdrawalData.paymentMethod)) {
      accountDetails = {
        phoneNumber: withdrawalData.phoneNumber,
        accountName: withdrawalData.accountName
      };
    } else if (withdrawalData.paymentMethod === 'bank_transfer') {
      accountDetails = {
        accountNumber: withdrawalData.accountNumber,
        accountName: withdrawalData.accountName,
        bankName: withdrawalData.bankName
      };
    }

    const success = await requestWithdrawal(amount, withdrawalData.paymentMethod, accountDetails);
    if (success) {
      setWithdrawalData({
        amount: '',
        paymentMethod: '',
        accountNumber: '',
        accountName: '',
        bankName: '',
        phoneNumber: ''
      });
      setIsWithdrawalDialogOpen(false);
    }
  };

  const renderAccountFields = () => {
    switch (withdrawalData.paymentMethod) {
      case 'airtel_money':
      case 'orange_money':
      case 'mpesa':
        return (
          <>
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                value={withdrawalData.phoneNumber}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Ex: +243123456789"
              />
            </div>
            <div>
              <Label htmlFor="account-name">Nom du compte</Label>
              <Input
                id="account-name"
                value={withdrawalData.accountName}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="Nom sur le compte"
              />
            </div>
          </>
        );
      case 'bank_transfer':
        return (
          <>
            <div>
              <Label htmlFor="bank-name">Nom de la banque</Label>
              <Input
                id="bank-name"
                value={withdrawalData.bankName}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Ex: Equity Bank"
              />
            </div>
            <div>
              <Label htmlFor="account-number">Numéro de compte</Label>
              <Input
                id="account-number"
                value={withdrawalData.accountNumber}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Numéro de compte bancaire"
              />
            </div>
            <div>
              <Label htmlFor="account-name">Nom du titulaire</Label>
              <Input
                id="account-name"
                value={withdrawalData.accountName}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="Nom du titulaire du compte"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Disponible</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.availableBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium leading-none">Total Demandé</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRequested)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Total Payé</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium leading-none">En Attente</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balance" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="balance">Solde</TabsTrigger>
          <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          {!isMobile && <TabsTrigger value="history">Historique</TabsTrigger>}
        </TabsList>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solde de Commission</CardTitle>
              <CardDescription>
                Montant disponible pour retrait depuis vos commissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(stats.availableBalance)}
                </div>
                <p className="text-muted-foreground">Disponible pour retrait</p>
              </div>

              <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={stats.availableBalance <= 0}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Demander un retrait
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Demande de Retrait</DialogTitle>
                    <DialogDescription>
                      Remplissez les détails pour votre demande de retrait
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Montant (CDF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={withdrawalData.amount}
                        onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Ex: 50000"
                        max={stats.availableBalance}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum: {formatCurrency(stats.availableBalance)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="payment-method">Méthode de paiement</Label>
                      <Select 
                        value={withdrawalData.paymentMethod} 
                        onValueChange={(value) => setWithdrawalData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="airtel_money">Airtel Money</SelectItem>
                          <SelectItem value="orange_money">Orange Money</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {renderAccountFields()}

                    <Button 
                      onClick={handleWithdrawalRequest} 
                      disabled={loading || !withdrawalData.amount || !withdrawalData.paymentMethod}
                      className="w-full"
                    >
                      {loading ? 'Traitement...' : 'Demander le retrait'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id}>
                <CardContent className="p-4">
                  <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{formatCurrency(withdrawal.amount)}</span>
                          <Badge variant={getStatusVariant(withdrawal.status) as any}>
                            {getStatusLabel(withdrawal.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {getPaymentMethodIcon(withdrawal.payment_method)}
                          <span>{getPaymentMethodLabel(withdrawal.payment_method)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 ${isMobile ? 'justify-between' : ''}`}>
                      <div className={`${isMobile ? '' : 'text-right'}`}>
                        <p className="text-sm">{formatDate(withdrawal.requested_at)}</p>
                        {withdrawal.processed_at && (
                          <p className="text-xs text-muted-foreground">
                            Traité: {formatDate(withdrawal.processed_at)}
                          </p>
                        )}
                      </div>
                      {withdrawal.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelWithdrawal(withdrawal.id)}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                  {withdrawal.notes && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <strong>Note:</strong> {withdrawal.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {withdrawals.length === 0 && (
            <div className="text-center py-8">
              <ArrowUpRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune demande de retrait pour le moment</p>
            </div>
          )}
        </TabsContent>

        {!isMobile && (
          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Résumé des Retraits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total demandes:</span>
                      <span>{withdrawals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">En attente:</span>
                      <span>{withdrawals.filter(w => w.status === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Approuvées:</span>
                      <span>{withdrawals.filter(w => w.status === 'approved').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payées:</span>
                      <span>{withdrawals.filter(w => w.status === 'paid').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Méthodes Utilisées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      withdrawals.reduce((acc, w) => {
                        acc[w.payment_method] = (acc[w.payment_method] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([method, count]) => (
                      <div key={method} className="flex justify-between">
                        <span className="text-sm">{getPaymentMethodLabel(method)}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};