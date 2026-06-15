import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface EscrowStats {
  total_held: number;
  total_released: number;
  pending_orders_count: number;
  auto_release_soon_count: number;
}

export const VendorEscrowSummary: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_vendor_escrow_stats', {
        vendor_uuid: user.id
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement stats escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="mb-4 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          📊 Résumé financier
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fonds en attente */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-xs text-muted-foreground">
                {stats.pending_orders_count} commande(s)
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatAmount(stats.total_held)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              En attente confirmation client
            </p>
          </div>

          {/* Libération bientôt */}
          {stats.auto_release_soon_count > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-muted-foreground">
                  {stats.auto_release_soon_count} commande(s)
                </span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                Libération dans 24h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sera automatiquement libéré
              </p>
            </div>
          )}

          {/* Total libéré */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xs text-muted-foreground">Historique</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(stats.total_released)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total libéré (après commission)
            </p>
          </div>
        </div>

        {/* Info explicative */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Comment ça marche ?</span> Les fonds sont sécurisés en escrow
            jusqu'à confirmation du client. Si pas de confirmation sous 7 jours, libération automatique.
            Commission plateforme : 5%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
