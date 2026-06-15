import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ModerationEvent {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  action: string;
  moderation_status: string;
  rejection_reason: string | null;
  moderated_at: string;
}

export const VendorModerationHistory = () => {
  const { user } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['vendor-moderation-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('marketplace_products')
        .select('id, title, images, moderation_status, rejection_reason, moderated_at')
        .eq('seller_id', user.id)
        .not('moderation_status', 'is', null)
        .order('moderated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(product => ({
        id: product.id,
        product_id: product.id,
        product_title: product.title,
        product_image: product.images?.[0] || null,
        action: product.moderation_status,
        moderation_status: product.moderation_status,
        rejection_reason: product.rejection_reason,
        moderated_at: product.moderated_at,
      })) as ModerationEvent[];
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['vendor-moderation-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('marketplace_products')
        .select('moderation_status')
        .eq('seller_id', user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const approved = data?.filter(p => p.moderation_status === 'approved').length || 0;
      const rejected = data?.filter(p => p.moderation_status === 'rejected').length || 0;
      const pending = data?.filter(p => p.moderation_status === 'pending').length || 0;

      return {
        total,
        approved,
        rejected,
        pending,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    },
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique de Modération</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Produits</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approuvés</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.approved}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejetés</CardDescription>
              <CardTitle className="text-2xl text-destructive">{stats.rejected}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Taux d'approbation
              </CardDescription>
              <CardTitle className="text-2xl">{stats.approvalRate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de Modération</CardTitle>
          <CardDescription>
            Historique des décisions de modération sur vos produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun historique de modération
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(event.moderation_status)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{event.product_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.moderated_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                        {getStatusBadge(event.moderation_status)}
                      </div>

                      {event.product_image && (
                        <img
                          src={event.product_image}
                          alt={event.product_title}
                          className="w-full h-24 object-cover rounded-md"
                        />
                      )}

                      {event.rejection_reason && event.moderation_status === 'rejected' && (
                        <div className="p-2 bg-destructive/10 rounded-md">
                          <p className="text-xs font-medium text-destructive">
                            Raison du rejet:
                          </p>
                          <p className="text-xs text-destructive/80 mt-1">
                            {event.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
