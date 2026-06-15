import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Clock, 
  TrendingUp, 
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  RefreshCw,
  History,
  Shield,
  ChevronRight,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVendorFinances, VendorTransaction, EscrowPayment, WithdrawalRequest } from '@/hooks/useVendorFinances';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number, currency: string = 'CDF') => {
  return new Intl.NumberFormat('fr-CD', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ` ${currency}`;
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  currency: string;
  icon: React.ElementType;
  color: 'green' | 'orange' | 'blue' | 'purple';
  subtitle?: string;
}> = ({ title, value, currency, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-600',
    orange: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-600',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 bg-gradient-to-br",
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{formatCurrency(value, currency)}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-xl bg-background/50", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

// Transaction Item Component
const TransactionItem: React.FC<{ transaction: VendorTransaction }> = ({ transaction }) => {
  const isCredit = transaction.type === 'credit';
  const isCommission = transaction.type === 'commission';
  const isWithdrawal = transaction.type === 'withdrawal' || transaction.type === 'debit';

  const getIcon = () => {
    if (isCredit) return <ArrowDownCircle className="h-4 w-4 text-emerald-500" />;
    if (isCommission) return <Shield className="h-4 w-4 text-blue-500" />;
    return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'completed':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Complété</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">En cours</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-500/30 text-[10px]">Échoué</Badge>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="p-2 rounded-full bg-background">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
        </p>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-semibold",
          isCredit ? "text-emerald-600" : "text-red-600"
        )}>
          {isCredit ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), transaction.currency)}
        </p>
        {getStatusBadge()}
      </div>
    </motion.div>
  );
};

// Escrow Item Component
const EscrowItem: React.FC<{ payment: EscrowPayment }> = ({ payment }) => {
  const isHeld = payment.status === 'held';
  const isReleased = payment.status === 'released';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className={cn(
        "p-2 rounded-full",
        isHeld ? "bg-amber-500/20" : isReleased ? "bg-emerald-500/20" : "bg-red-500/20"
      )}>
        {isHeld ? <Clock className="h-4 w-4 text-amber-600" /> : 
         isReleased ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
         <XCircle className="h-4 w-4 text-red-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Commande #{payment.orderId.substring(0, 8)}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(payment.createdAt), 'dd MMM yyyy', { locale: fr })}
          {payment.releasedAt && ` • Libéré le ${format(new Date(payment.releasedAt), 'dd MMM', { locale: fr })}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatCurrency(payment.sellerAmount, payment.currency)}</p>
        <Badge variant="outline" className={cn(
          "text-[10px]",
          isHeld ? "text-amber-600 border-amber-500/30" : 
          isReleased ? "text-emerald-600 border-emerald-500/30" :
          "text-red-600 border-red-500/30"
        )}>
          {isHeld ? 'En attente' : isReleased ? 'Libéré' : 'Remboursé'}
        </Badge>
      </div>
    </motion.div>
  );
};

// Withdrawal Form Component
const WithdrawalForm: React.FC<{
  availableBalance: number;
  currency: string;
  onWithdraw: (data: { amount: number; provider: string; phoneNumber: string }) => void;
  isWithdrawing: boolean;
}> = ({ availableBalance, currency, onWithdraw, isWithdrawing }) => {
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const minWithdrawal = 5000;
  const maxWithdrawal = availableBalance;
  const fees = Math.round(amount * 0.02);
  const netAmount = amount - fees;

  const canWithdraw = amount >= minWithdrawal && 
                      amount <= maxWithdrawal && 
                      provider && 
                      phoneNumber.length >= 9;

  const handleSubmit = () => {
    if (!canWithdraw) return;
    onWithdraw({ amount, provider, phoneNumber });
  };

  const providers = [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'afrimoney', label: 'Afrimoney' }
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          Demander un retrait
        </CardTitle>
        <CardDescription>
          Transférez votre solde vers votre compte mobile money
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Montant à retirer</Label>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(amount, currency)}
            </span>
          </div>
          
          <Slider
            value={[amount]}
            onValueChange={([val]) => setAmount(val)}
            min={0}
            max={maxWithdrawal}
            step={1000}
            className="py-4"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: {formatCurrency(minWithdrawal, currency)}</span>
            <span>Max: {formatCurrency(maxWithdrawal, currency)}</span>
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2">
            {[10000, 25000, 50000, 100000].filter(v => v <= maxWithdrawal).map((quickAmount) => (
              <Button
                key={quickAmount}
                variant={amount === quickAmount ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(quickAmount)}
                className="text-xs"
              >
                {formatCurrency(quickAmount, currency)}
              </Button>
            ))}
            {maxWithdrawal > 0 && (
              <Button
                variant={amount === maxWithdrawal ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(maxWithdrawal)}
                className="text-xs"
              >
                Tout
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>Opérateur mobile money</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un opérateur" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {p.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label>Numéro de téléphone</Label>
          <Input
            type="tel"
            placeholder="Ex: 0812345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            maxLength={12}
          />
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant demandé</span>
            <span>{formatCurrency(amount, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais (2%)</span>
            <span className="text-red-500">-{formatCurrency(fees, currency)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Vous recevrez</span>
            <span className="text-primary">{formatCurrency(netAmount, currency)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canWithdraw || isWithdrawing}
          className="w-full"
          size="lg"
        >
          {isWithdrawing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Retirer {formatCurrency(netAmount, currency)}
            </>
          )}
        </Button>

        {availableBalance < minWithdrawal && (
          <p className="text-xs text-center text-muted-foreground">
            Solde minimum requis: {formatCurrency(minWithdrawal, currency)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Withdrawal Request Item Component  
const WithdrawalRequestItem: React.FC<{ request: WithdrawalRequest }> = ({ request }) => {
  const statusConfig = {
    pending: { label: 'En attente', color: 'amber', icon: Clock },
    paid: { label: 'Payé', color: 'emerald', icon: CheckCircle2 },
    approved: { label: 'Approuvé', color: 'emerald', icon: CheckCircle2 },
    rejected: { label: 'Rejeté', color: 'red', icon: XCircle }
  };

  const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  const colorClasses = {
    amber: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-600 border-red-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className={cn("p-2 rounded-full", colorClasses[config.color as keyof typeof colorClasses])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{formatCurrency(request.amount, request.currency)}</p>
        <p className="text-xs text-muted-foreground">
          {request.provider ? `${request.provider} • ${request.phone}` : 'Mobile Money'}
        </p>
      </div>
      <div className="text-right">
        <Badge variant="outline" className={cn("text-[10px]", colorClasses[config.color as keyof typeof colorClasses])}>
          {config.label}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(request.createdAt), 'dd MMM', { locale: fr })}
        </p>
      </div>
    </motion.div>
  );
};

// Main Component
export const VendorFinancesDashboard: React.FC = () => {
  const { 
    stats, 
    transactions, 
    escrowPayments,
    withdrawalRequests,
    isLoading, 
    refetch,
    withdraw,
    isWithdrawing 
  } = useVendorFinances();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Finances</h1>
          <p className="text-muted-foreground">Gérez vos revenus et retraits</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Solde disponible"
          value={stats.availableBalance}
          currency={stats.currency}
          icon={Wallet}
          color="green"
          subtitle="Retirable maintenant"
        />
        <StatCard
          title="En escrow"
          value={stats.escrowHeld}
          currency={stats.currency}
          icon={Clock}
          color="orange"
          subtitle="En attente de confirmation"
        />
        <StatCard
          title="Total gagné"
          value={stats.totalEarned}
          currency={stats.currency}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total retiré"
          value={stats.totalWithdrawn}
          currency={stats.currency}
          icon={ArrowUpCircle}
          color="purple"
        />
      </div>

      {/* Pending Withdrawals Alert */}
      {stats.pendingWithdrawals > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
          <div className="flex-1">
            <p className="font-medium text-amber-600">Retrait en cours</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(stats.pendingWithdrawals, stats.currency)} en attente de traitement
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <WithdrawalForm
          availableBalance={stats.availableBalance}
          currency={stats.currency}
          onWithdraw={withdraw}
          isWithdrawing={isWithdrawing}
        />

        {/* Tabs for History */}
        <Card>
          <Tabs defaultValue="withdrawals" className="h-full">
            <CardHeader className="pb-2">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="withdrawals" className="text-xs">
                  <Banknote className="h-3 w-3 mr-1" />
                  Retraits
                </TabsTrigger>
                <TabsTrigger value="escrow" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Escrow
                </TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  Historique
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Withdrawal Requests Tab */}
              <TabsContent value="withdrawals" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {withdrawalRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Banknote className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Aucune demande de retrait</p>
                        <p className="text-xs text-muted-foreground">
                          Vos demandes de retrait apparaîtront ici
                        </p>
                      </div>
                    ) : (
                      withdrawalRequests.map((request) => (
                        <WithdrawalRequestItem key={request.id} request={request} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="escrow" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {escrowPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Aucun paiement escrow</p>
                        <p className="text-xs text-muted-foreground">
                          Les paiements de vos commandes apparaîtront ici
                        </p>
                      </div>
                    ) : (
                      escrowPayments.map((payment) => (
                        <EscrowItem key={payment.id} payment={payment} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="transactions" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Aucune transaction</p>
                        <p className="text-xs text-muted-foreground">
                          Votre historique de transactions apparaîtra ici
                        </p>
                      </div>
                    ) : (
                      transactions.map((transaction) => (
                        <TransactionItem key={transaction.id} transaction={transaction} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
