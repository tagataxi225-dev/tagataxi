import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Clock, 
  TrendingUp, 
  ArrowUpCircle,
  Loader2,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRestaurantWithdrawal, WithdrawalRequest } from '@/hooks/useRestaurantWithdrawal';
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
          <p className="text-xl font-bold">{formatCurrency(value, currency)}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-xl bg-background/50", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
};

// Withdrawal Request Item
const WithdrawalRequestItem: React.FC<{ request: WithdrawalRequest }> = ({ request }) => {
  const getStatusBadge = () => {
    switch (request.status) {
      case 'approved':
      case 'paid':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Refusé</Badge>;
      default:
        return <Badge variant="outline">{request.status}</Badge>;
    }
  };

  const getIcon = () => {
    switch (request.status) {
      case 'approved':
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
        <p className="text-sm font-medium">{request.provider} - {request.phone}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatCurrency(request.netAmount, request.currency)}</p>
        {getStatusBadge()}
      </div>
    </motion.div>
  );
};

export const RestaurantWithdrawalCard: React.FC = () => {
  const { 
    stats, 
    withdrawalRequests,
    isLoading, 
    refetch,
    withdraw,
    isWithdrawing 
  } = useRestaurantWithdrawal();

  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const minWithdrawal = 5000;
  const maxWithdrawal = stats.availableBalance;
  const fees = Math.round(amount * 0.02);
  const netAmount = amount - fees;

  const canWithdraw = amount >= minWithdrawal && 
                      amount <= maxWithdrawal && 
                      provider && 
                      phoneNumber.length >= 9;

  const handleSubmit = () => {
    if (!canWithdraw) return;
    withdraw({ amount, provider, phoneNumber });
    // Reset form after submission
    setAmount(0);
    setPhoneNumber('');
  };

  const providers = [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'afrimoney', label: 'Afrimoney' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Retrait de fonds</h2>
          <p className="text-sm text-muted-foreground">Transférez vos gains vers votre mobile money</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
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
          subtitle="En attente"
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
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
          <AlertDescription className="text-amber-600">
            <strong>{formatCurrency(stats.pendingWithdrawals, stats.currency)}</strong> en attente de traitement (1-24h)
          </AlertDescription>
        </Alert>
      )}

      {/* Withdrawal Form */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Demander un retrait
          </CardTitle>
          <CardDescription>
            Le traitement est manuel et prend 1-24h
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Amount Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Montant</Label>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(amount, stats.currency)}
              </span>
            </div>
            
            <Slider
              value={[amount]}
              onValueChange={([val]) => setAmount(val)}
              min={0}
              max={maxWithdrawal}
              step={1000}
              className="py-3"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {formatCurrency(minWithdrawal, stats.currency)}</span>
              <span>Max: {formatCurrency(maxWithdrawal, stats.currency)}</span>
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
                  {formatCurrency(quickAmount, stats.currency)}
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
          <div className="space-y-2 p-3 rounded-xl bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant demandé</span>
              <span>{formatCurrency(amount, stats.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais (2%)</span>
              <span className="text-red-500">-{formatCurrency(fees, stats.currency)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Vous recevrez</span>
              <span className="text-primary">{formatCurrency(netAmount, stats.currency)}</span>
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
                Envoi en cours...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Demander le retrait
              </>
            )}
          </Button>

          {stats.availableBalance < minWithdrawal && (
            <p className="text-xs text-center text-muted-foreground">
              Solde minimum requis: {formatCurrency(minWithdrawal, stats.currency)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {withdrawalRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Historique des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2">
                {withdrawalRequests.map((request) => (
                  <WithdrawalRequestItem key={request.id} request={request} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
