import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionEarning {
  id: string;
  driver_id: string;
  subscription_amount: number;
  partner_commission_amount: number;
  payment_date: string;
  status: string;
  chauffeurs?: {
    display_name: string;
    email: string;
  };
}

export const PartnerSubscriptionEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<SubscriptionEarning[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalPending: 0,
    totalDrivers: 0,
    thisMonth: 0
  });

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer le partner_id via partenaires table
      const { data: partnerData, error: partnerError } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partnerData) {
        console.error('Partner not found:', partnerError);
        return;
      }

      // Récupérer les gains
      const { data: earningsData, error: earningsError } = await supabase
        .from('partner_subscription_earnings')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('payment_date', { ascending: false });

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
        return;
      }

      // Enrichir avec les données chauffeurs
      const enrichedEarnings = await Promise.all(
        (earningsData || []).map(async (earning) => {
          const { data: driverData } = await supabase
            .from('chauffeurs')
            .select('display_name, email')
            .eq('user_id', earning.driver_id)
            .single();

          return {
            ...earning,
            chauffeurs: driverData || { display_name: 'Inconnu', email: '' }
          };
        })
      );

      setEarnings(enrichedEarnings);

      // Calculer les statistiques
      const totalEarned = earningsData?.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.partner_commission_amount), 0) || 0;
      const totalPending = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.partner_commission_amount), 0) || 0;
      const uniqueDrivers = new Set(earningsData?.map(e => e.driver_id) || []).size;
      
      const currentMonth = new Date().getMonth();
      const thisMonthEarnings = earningsData?.filter(e => {
        const earningMonth = new Date(e.payment_date).getMonth();
        return earningMonth === currentMonth && e.status === 'paid';
      }).reduce((sum, e) => sum + Number(e.partner_commission_amount), 0) || 0;

      setStats({
        totalEarned,
        totalPending,
        totalDrivers: uniqueDrivers,
        thisMonth: thisMonthEarnings
      });

    } catch (error) {
      console.error('Error in fetchEarnings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Gains Abonnements</h2>
        <p className="text-muted-foreground mt-1">
          Commissions de 5% sur les abonnements de vos chauffeurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gagné</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalEarned.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Commission totale payée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.thisMonth.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gains du mois en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.totalPending.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Commissions à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDrivers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avec abonnements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune commission pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {earning.chauffeurs?.display_name || 'Chauffeur inconnu'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(earning.payment_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      +{earning.partner_commission_amount.toLocaleString()} CDF
                    </p>
                    <p className="text-xs text-muted-foreground">
                      5% de {earning.subscription_amount.toLocaleString()} CDF
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      earning.status === 'paid' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {earning.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};