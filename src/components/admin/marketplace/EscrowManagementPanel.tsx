import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, Lock, Unlock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export const EscrowManagementPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch escrow transactions (PLACEHOLDER - table marketplace_escrow n'existe pas encore)
  const { data: escrowTransactions, isLoading } = useQuery({
    queryKey: ['adminEscrowTransactions'],
    queryFn: async () => {
      // Pour l'instant, retourner des données simulées car la table escrow n'existe pas
      // À implémenter après création de la table marketplace_escrow
      return [];
    },
    refetchInterval: 30000
  });

  // Release escrow mutation
  const releaseEscrowMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const { data, error } = await supabase.functions.invoke('marketplace-escrow-release', {
        body: { escrow_id: escrowId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEscrowTransactions'] });
      toast({
        title: "✅ Escrow libéré",
        description: "Les fonds ont été transférés au vendeur",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Cancel escrow mutation
  const cancelEscrowMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const { data, error } = await supabase.functions.invoke('marketplace-escrow-cancel', {
        body: { escrow_id: escrowId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEscrowTransactions'] });
      toast({
        title: "✅ Escrow annulé",
        description: "Les fonds ont été remboursés à l'acheteur",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      held: { label: "En attente", variant: "secondary" as const, icon: Lock },
      released: { label: "Libéré", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Annulé", variant: "destructive" as const, icon: AlertCircle },
      disputed: { label: "Litige", variant: "destructive" as const, icon: AlertCircle }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.held;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate stats
  const stats = { totalHeld: 0, totalReleased: 0, countHeld: 0, countReleased: 0 };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fonds en Escrow</CardTitle>
            <Lock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHeld.toLocaleString()} CDF</div>
            <p className="text-xs text-muted-foreground">{stats?.countHeld} transactions en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fonds Libérés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReleased.toLocaleString()} CDF</div>
            <p className="text-xs text-muted-foreground">{stats?.countReleased} transactions complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escrowTransactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Depuis le début</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Transactions Escrow Marketplace
          </CardTitle>
          <CardDescription>
            Gestion des fonds en séquestre pour sécuriser les transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Système Escrow en Développement</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Le système de séquestre pour sécuriser les paiements marketplace sera bientôt disponible.
              La table <code className="bg-muted px-2 py-1 rounded">marketplace_escrow</code> doit être créée.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✅ Fonctionnalités prévues :</p>
              <ul className="list-disc list-inside">
                <li>Blocage des fonds jusqu'à confirmation de livraison</li>
                <li>Libération automatique après validation client</li>
                <li>Gestion des litiges et remboursements</li>
                <li>Tracking complet des transactions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
