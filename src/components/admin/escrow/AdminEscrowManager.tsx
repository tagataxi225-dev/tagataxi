import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search,
  Wallet,
  ArrowRightLeft,
  XCircle,
  Eye,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EscrowDetailsPanel } from './EscrowDetailsPanel';
import { EscrowDisputeDialog } from './EscrowDisputeDialog';

interface EscrowTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  created_at: string;
  released_at?: string | null;
  dispute_reason?: string | null;
}

interface EscrowStats {
  totalHeld: number;
  totalAmount: number;
  disputed: number;
  released: number;
  refunded: number;
}

export const AdminEscrowManager: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('held');
  const [stats, setStats] = useState<EscrowStats>({
    totalHeld: 0,
    totalAmount: 0,
    disputed: 0,
    released: 0,
    refunded: 0
  });
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeEscrow, setDisputeEscrow] = useState<EscrowTransaction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadEscrowData();
  }, []);

  const loadEscrowData = async () => {
    setLoading(true);
    try {
      // Charger depuis escrow_transactions
      const { data: escrowData, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allTransactions = escrowData || [];
      setTransactions(allTransactions);

      // Calculer les stats
      const held = allTransactions.filter(t => t.status === 'held');
      const disputed = allTransactions.filter(t => t.status === 'disputed');
      const released = allTransactions.filter(t => t.status === 'released');
      const refunded = allTransactions.filter(t => t.status === 'refunded');

      setStats({
        totalHeld: held.length,
        totalAmount: held.reduce((sum, t) => sum + (t.total_amount || 0), 0),
        disputed: disputed.length,
        released: released.length,
        refunded: refunded.length
      });

    } catch (error) {
      console.error('Error loading escrow data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données escrow',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (
    escrowId: string, 
    action: 'force_release' | 'force_refund' | 'open_dispute' | 'resolve_dispute',
    adminNotes?: string,
    resolution?: any
  ) => {
    setActionLoading(escrowId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-escrow-management', {
        body: {
          action,
          escrowId,
          adminNotes: adminNotes || `Action admin: ${action}`,
          resolution
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Échec de l\'action');

      toast({
        title: 'Action effectuée',
        description: data.message || 'L\'action a été exécutée avec succès'
      });

      await loadEscrowData();
      setSelectedEscrow(null);

    } catch (error: any) {
      console.error('Admin action error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'exécuter l\'action',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = t.status === activeStatus;
    const matchesSearch = searchQuery === '' || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.order_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-amber-500/20 text-amber-400';
      case 'disputed': return 'bg-red-500/20 text-red-400';
      case 'released': return 'bg-green-500/20 text-green-400';
      case 'refunded': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'held': return <Clock className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      case 'released': return <CheckCircle2 className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion des Escrow & Conflits
          </h2>
          <p className="text-muted-foreground">
            Gérez les paiements sécurisés et résolvez les conflits
          </p>
        </div>
        <Button onClick={loadEscrowData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats.totalHeld}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">FC bloqués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{stats.disputed}</p>
                <p className="text-xs text-muted-foreground">Conflits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.released}</p>
                <p className="text-xs text-muted-foreground">Libérés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.refunded}</p>
                <p className="text-xs text-muted-foreground">Remboursés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Transactions Escrow</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStatus} onValueChange={setActiveStatus}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="held" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                En attente
                {stats.totalHeld > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {stats.totalHeld}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="disputed" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Conflits
                {stats.disputed > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {stats.disputed}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="released" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Libérés
              </TabsTrigger>
              <TabsTrigger value="refunded" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Remboursés
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune transaction {activeStatus}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((escrow) => (
                    <Card 
                      key={escrow.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEscrow(escrow)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${getStatusColor(escrow.status)}`}>
                              {getStatusIcon(escrow.status)}
                            </div>
                            <div>
                              <p className="font-medium">
                                Commande #{escrow.order_id?.substring(0, 8)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(escrow.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {escrow.total_amount?.toLocaleString()} FC
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Commission: {escrow.platform_fee?.toLocaleString()} FC
                              </p>
                            </div>
                            
                            <Badge className={getStatusColor(escrow.status)}>
                              {escrow.status === 'held' && 'En attente'}
                              {escrow.status === 'disputed' && 'Conflit'}
                              {escrow.status === 'released' && 'Libéré'}
                              {escrow.status === 'refunded' && 'Remboursé'}
                            </Badge>

                            {/* Quick Actions for held status */}
                            {escrow.status === 'held' && (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-500 hover:text-green-600"
                                  onClick={() => handleAdminAction(escrow.id, 'force_release')}
                                  disabled={actionLoading === escrow.id}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setDisputeEscrow(escrow);
                                    setShowDisputeDialog(true);
                                  }}
                                  disabled={actionLoading === escrow.id}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {selectedEscrow && (
        <EscrowDetailsPanel
          escrow={selectedEscrow}
          onClose={() => setSelectedEscrow(null)}
          onAction={handleAdminAction}
          actionLoading={actionLoading}
        />
      )}

      {/* Dispute Dialog */}
      {showDisputeDialog && disputeEscrow && (
        <EscrowDisputeDialog
          escrow={disputeEscrow}
          open={showDisputeDialog}
          onClose={() => {
            setShowDisputeDialog(false);
            setDisputeEscrow(null);
          }}
          onSubmit={(reason, notes) => {
            handleAdminAction(disputeEscrow.id, 'open_dispute', notes, { reason });
            setShowDisputeDialog(false);
            setDisputeEscrow(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminEscrowManager;
