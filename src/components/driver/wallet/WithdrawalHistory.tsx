/**
 * 📜 Historique des retraits pour chauffeurs (avec statut 'paid')
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Banknote, Clock, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, Phone, Calendar,
  AlertCircle, DollarSign
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  withdrawal_method: string;
  mobile_money_provider: string | null;
  mobile_money_phone: string | null;
  created_at: string;
  processed_at: string | null;
  paid_at: string | null;
  failure_reason: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  paid: { label: 'Payé', color: 'bg-green-500', icon: DollarSign },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
  processing: { label: 'En cours', color: 'bg-blue-500', icon: Clock }
};

export const WithdrawalHistory = () => {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['driver-withdrawals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as WithdrawalRequest[];
    }
  });

  const displayedWithdrawals = expanded ? withdrawals : withdrawals.slice(0, 3);
  
  // Stats rapides
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'paid' || w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Historique des retraits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Historique des retraits
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
              {pendingCount} en attente
            </Badge>
          )}
        </div>
        {withdrawals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Total retiré: <span className="font-medium">{totalWithdrawn.toLocaleString()} CDF</span>
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun retrait effectué</p>
            <p className="text-sm">Vos demandes de retrait apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayedWithdrawals.map((withdrawal, index) => {
                const config = statusConfig[withdrawal.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isExpanded = selectedId === withdrawal.id;

                return (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                        isExpanded && "ring-2 ring-primary/20"
                      )}
                      onClick={() => setSelectedId(isExpanded ? null : withdrawal.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            withdrawal.status === 'paid' || withdrawal.status === 'approved' 
                              ? "bg-green-100 dark:bg-green-900/30" :
                            withdrawal.status === 'rejected' ? "bg-red-100 dark:bg-red-900/30" :
                            "bg-yellow-100 dark:bg-yellow-900/30"
                          )}>
                            <StatusIcon className={cn(
                              "w-5 h-5",
                              withdrawal.status === 'paid' || withdrawal.status === 'approved' 
                                ? "text-green-600" :
                              withdrawal.status === 'rejected' ? "text-red-600" :
                              "text-yellow-600"
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{withdrawal.amount.toLocaleString()} CDF</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(withdrawal.created_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(config.color, "text-white")}>
                          {config.label}
                        </Badge>
                      </div>

                      {/* Détails étendus */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t space-y-2"
                          >
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>Paiement vers: {withdrawal.mobile_money_phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Banknote className="w-4 h-4" />
                              <span>{withdrawal.mobile_money_provider || withdrawal.withdrawal_method}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Demandé le {format(new Date(withdrawal.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                            </div>
                            {withdrawal.paid_at && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <DollarSign className="w-4 h-4" />
                                <span>Payé le {format(new Date(withdrawal.paid_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                              </div>
                            )}
                            {withdrawal.processed_at && !withdrawal.paid_at && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4" />
                                <span>Traité le {format(new Date(withdrawal.processed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                              </div>
                            )}
                            {withdrawal.failure_reason && (
                              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2 mt-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{withdrawal.failure_reason}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {withdrawals.length > 3 && (
              <Button
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="w-full"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Voir tout ({withdrawals.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
