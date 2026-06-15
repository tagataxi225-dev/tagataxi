/**
 * 💰 Page Admin - Gestion des Demandes de Retrait (100% Manuel avec statut 'paid')
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, CheckCircle, XCircle, Clock, Banknote, 
  Phone, User, Calendar, AlertTriangle, RefreshCw,
  CheckCheck, Filter, DollarSign, Copy, ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_type: string;
  amount: number;
  currency: string;
  withdrawal_method: string;
  mobile_money_provider: string | null;
  mobile_money_phone: string | null;
  kwenda_pay_phone: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  paid_at: string | null;
  admin_reference: string | null;
  admin_notes: string | null;
  failure_reason: string | null;
}

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  paid: { label: 'Payé', color: 'bg-green-500', icon: DollarSign },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
  processing: { label: 'En cours', color: 'bg-blue-500', icon: Loader2 }
};

const userTypeLabels: Record<string, string> = {
  client: '👤 Client',
  driver: '🚗 Chauffeur',
  seller: '🏪 Vendeur', // ✅ DB utilise 'seller' pas 'vendor'
  vendor: '🏪 Marchand', // fallback legacy
  partner: '🤝 Partenaire'
};

const providerColors: Record<string, string> = {
  airtel: 'bg-red-500',
  orange: 'bg-orange-500',
  mpesa: 'bg-green-500'
};

export const WithdrawalManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<'pay' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminReference, setAdminReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Sélection multiple pour paiement en lot
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  
  // Filtres
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('');

  // Charger les demandes de retrait
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['withdrawal-requests', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WithdrawalRequest[];
    }
  });

  // Appliquer les filtres
  const filteredRequests = requests.filter(r => {
    if (filterProvider !== 'all' && r.mobile_money_provider !== filterProvider) return false;
    if (filterUserType !== 'all' && r.user_type !== filterUserType) return false;
    if (maxAmountFilter && r.amount > parseInt(maxAmountFilter)) return false;
    return true;
  });

  // Mutation pour marquer comme payé avec référence transaction
  const payMutation = useMutation({
    mutationFn: async ({ requestId, reference, notes }: { requestId: string; reference?: string; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { 
          action: 'approve_withdrawal', 
          withdrawalId: requestId,
          adminReference: reference,
          adminNotes: notes
        }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: () => {
      toast({ title: "✅ Retrait marqué comme payé", description: "L'utilisateur a été notifié" });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedRequest(null);
      setConfirmAction(null);
      setAdminReference('');
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mutation pour rejeter
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { action: 'reject_withdrawal', withdrawalId: requestId, rejectionReason: reason }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: () => {
      toast({ title: "Retrait rejeté", description: "Le montant a été remboursé au wallet" });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedRequest(null);
      setConfirmAction(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mutation pour paiement en lot
  const batchPayMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { action: 'batch_approve_withdrawals', withdrawalIds: ids }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Paiements en lot terminés", 
        description: data.message 
      });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedIds(new Set());
      setShowBatchConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const handleAction = (request: WithdrawalRequest, action: 'pay' | 'reject') => {
    setSelectedRequest(request);
    setConfirmAction(action);
  };

  const confirmHandler = () => {
    if (!selectedRequest) return;
    
    if (confirmAction === 'pay') {
      payMutation.mutate({ 
        requestId: selectedRequest.id, 
        reference: adminReference || undefined,
        notes: adminNotes || undefined
      });
    } else if (confirmAction === 'reject') {
      rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const pendingIds = filteredRequests
      .filter(r => r.status === 'pending')
      .map(r => r.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleBatchPay = () => {
    if (selectedIds.size === 0) return;
    setShowBatchConfirm(true);
  };

  const confirmBatchPay = () => {
    batchPayMutation.mutate(Array.from(selectedIds));
  };

  // Quick batch actions
  const selectUnder = (maxAmount: number) => {
    const ids = filteredRequests
      .filter(r => r.status === 'pending' && r.amount <= maxAmount)
      .map(r => r.id);
    setSelectedIds(new Set(ids));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié!", description: text });
  };

  // Stats
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const paidCount = requests.filter(r => r.status === 'paid' || r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const totalPending = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const selectedTotal = filteredRequests
    .filter(r => selectedIds.has(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            Gestion des Retraits
          </h2>
          <p className="text-muted-foreground">
            Effectuez les paiements manuellement puis marquez-les comme payés
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">À payer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{paidCount}</p>
              <p className="text-sm text-muted-foreground">Payés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejetés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPending.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">CDF à payer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-300">Comment traiter les retraits:</p>
              <ol className="list-decimal ml-4 mt-2 space-y-1 text-blue-700 dark:text-blue-400">
                <li>Copiez le numéro de téléphone affiché</li>
                <li>Effectuez le paiement Mobile Money manuellement</li>
                <li>Cliquez sur "Marquer comme payé" une fois le transfert effectué</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions Bar */}
      {activeTab === 'pending' && pendingCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CheckCheck className="w-5 h-5 text-primary" />
                <span className="font-medium">Actions en lot</span>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary">
                    {selectedIds.size} sélectionné(s) • {selectedTotal.toLocaleString()} CDF
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => selectUnder(50000)}>
                  ≤ 50k CDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectUnder(100000)}>
                  ≤ 100k CDF
                </Button>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Désélectionner
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleBatchPay}
                  disabled={selectedIds.size === 0 || batchPayMutation.isPending}
                >
                  {batchPayMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-2" />
                  )}
                  Marquer payés ({selectedIds.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterUserType} onValueChange={setFilterUserType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="driver">Chauffeurs</SelectItem>
                <SelectItem value="seller">Vendeurs</SelectItem>
                <SelectItem value="partner">Partenaires</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
                <SelectItem value="orange">Orange Money</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Montant max (CDF)" 
              className="w-40"
              type="number"
              value={maxAmountFilter}
              onChange={(e) => setMaxAmountFilter(e.target.value)}
            />
            {(filterProvider !== 'all' || filterUserType !== 'all' || maxAmountFilter) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterProvider('all');
                  setFilterUserType('all');
                  setMaxAmountFilter('');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="w-4 h-4" />
            À payer ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex gap-2">
            <DollarSign className="w-4 h-4" />
            Payés
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex gap-2">
            <XCircle className="w-4 h-4" />
            Rejetés
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune demande de retrait</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredRequests.map((request, index) => {
                  const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isSelected = selectedIds.has(request.id);
                  const providerColor = providerColors[request.mobile_money_provider || ''] || 'bg-gray-500';

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "hover:shadow-md transition-all",
                        isSelected && "ring-2 ring-primary"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            {/* Checkbox pour sélection */}
                            {request.status === 'pending' && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(request.id)}
                                className="mt-1"
                              />
                            )}

                            <div className="flex-1 space-y-3">
                              {/* Header */}
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(config.color, "text-white")}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {userTypeLabels[request.user_type] || request.user_type}
                                </span>
                              </div>

                              {/* Amount */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                  {request.amount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">{request.currency}</span>
                              </div>

                              {/* Payment Info - PROMINENTLY DISPLAYED */}
                              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", providerColor)} />
                                    <span className="font-medium">
                                      {request.mobile_money_provider?.toUpperCase() || 'Mobile Money'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-5 h-5 text-primary" />
                                  <span className="text-lg font-mono font-bold">
                                    {request.mobile_money_phone || 'N/A'}
                                  </span>
                                  {request.mobile_money_phone && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2"
                                      onClick={() => copyToClipboard(request.mobile_money_phone!)}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Details */}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDistanceToNow(new Date(request.created_at), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </div>
                                {request.paid_at && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <DollarSign className="w-4 h-4" />
                                    Payé le {format(new Date(request.paid_at), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                              </div>

                              {/* Rejection reason */}
                              {request.failure_reason && (
                                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                                  <span>{request.failure_reason}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {request.status === 'pending' && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAction(request, 'pay')}
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Marquer payé
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleAction(request, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rejeter
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Single Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'pay' ? 'Marquer comme payé ?' : 'Rejeter le retrait ?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {confirmAction === 'pay' ? (
                  <div className="space-y-4">
                    <p className="text-sm">
                      Confirmez que vous avez effectué le paiement de{' '}
                      <strong>{selectedRequest?.amount.toLocaleString()} {selectedRequest?.currency}</strong>{' '}
                      vers:
                    </p>
                    
                    {/* Récapitulatif paiement */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Opérateur</span>
                        <Badge className="bg-primary/20 text-primary">
                          {selectedRequest?.mobile_money_provider?.toUpperCase() || 'Mobile Money'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Numéro</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold">{selectedRequest?.mobile_money_phone}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedRequest?.mobile_money_phone || '');
                              toast({ title: "Copié!" });
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Montant</span>
                        <span className="text-xl font-bold text-primary">
                          {selectedRequest?.amount.toLocaleString()} {selectedRequest?.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Type utilisateur</span>
                        <span>{userTypeLabels[selectedRequest?.user_type || ''] || selectedRequest?.user_type}</span>
                      </div>
                    </div>
                    
                    {/* Référence transaction OBLIGATOIRE */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Référence transaction Mobile Money
                        <Badge variant="destructive" className="text-[10px]">Obligatoire</Badge>
                      </label>
                      <Input
                        placeholder="Ex: TXN123456789 ou ID de transaction"
                        value={adminReference}
                        onChange={(e) => setAdminReference(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Entrez la référence/ID reçue après le transfert Mobile Money
                      </p>
                    </div>
                    
                    {/* Notes optionnelles */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes admin (optionnel)</label>
                      <Textarea
                        placeholder="Notes internes sur ce paiement..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>
                      Le montant de{' '}
                      <strong>{selectedRequest?.amount.toLocaleString()} {selectedRequest?.currency}</strong>{' '}
                      sera remboursé au wallet de l'utilisateur.
                    </p>
                    <div>
                      <label className="text-sm font-medium">Raison du rejet :</label>
                      <Textarea
                        className="mt-2"
                        placeholder="Ex: Numéro invalide, informations incorrectes..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHandler}
              className={confirmAction === 'pay' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={
                payMutation.isPending || 
                rejectMutation.isPending || 
                (confirmAction === 'pay' && !adminReference.trim())
              }
            >
              {(payMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {confirmAction === 'pay' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider le paiement
                </>
              ) : 'Confirmer le rejet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Confirmation Dialog */}
      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer {selectedIds.size} retrait(s) comme payé(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous confirmez avoir effectué les paiements pour <strong>{selectedIds.size}</strong> demandes 
              totalisant <strong>{selectedTotal.toLocaleString()} CDF</strong>.
              <br /><br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchPay}
              className="bg-green-600 hover:bg-green-700"
              disabled={batchPayMutation.isPending}
            >
              {batchPayMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirmer les paiements
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WithdrawalManagement;
