import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';

export const RentalFinancialDashboard = () => {
  // Fetch statistiques financières
  const { data: financialStats, isLoading } = useQuery({
    queryKey: ['rental-financial-stats'],
    queryFn: async () => {
      // Récupérer les bookings location
      const { data: bookings, error: bookingsError } = await supabase
        .from('partner_rental_bookings')
        .select('total_price, status, created_at, partner_id');

      if (bookingsError) throw bookingsError;

      // Récupérer les abonnements actifs
      const { data: subscriptions, error: subsError } = await supabase
        .from('partner_rental_subscriptions')
        .select('*')
        .eq('status', 'active') as any;

      if (subsError) throw subsError;

      // Calculer les statistiques
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const monthlyRevenue = completedBookings
        .filter(b => {
          const bookingDate = new Date(b.created_at);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      // Commissions par partenaire (15% de commission)
      const partnerCommissions = completedBookings.reduce((acc, booking) => {
        const partnerId = booking.partner_id;
        const commission = (booking.total_price || 0) * 0.15;
        
        if (!acc[partnerId]) {
          acc[partnerId] = 0;
        }
        acc[partnerId] += commission;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions: subscriptions?.length || 0,
        subscriptionRevenue: subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
        completedBookings: completedBookings.length,
        partnerCommissions: Object.entries(partnerCommissions).map(([id, amount]) => ({
          partnerId: id,
          commission: amount
        })),
        averageBookingValue: completedBookings.length > 0 
          ? totalRevenue / completedBookings.length 
          : 0
      };
    },
    refetchInterval: 60000 // Rafraîchir toutes les minutes
  });

  const statCards = [
    {
      title: "Chiffre d'affaires total",
      value: `${(financialStats?.totalRevenue || 0).toLocaleString()} CDF`,
      description: "Toutes périodes confondues",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "CA du mois",
      value: `${(financialStats?.monthlyRevenue || 0).toLocaleString()} CDF`,
      description: "Revenus du mois en cours",
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      title: "Abonnements actifs",
      value: financialStats?.activeSubscriptions || 0,
      description: `${(financialStats?.subscriptionRevenue || 0).toLocaleString()} CDF/mois`,
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Réservations terminées",
      value: financialStats?.completedBookings || 0,
      description: `Moyenne: ${Math.round(financialStats?.averageBookingValue || 0).toLocaleString()} CDF`,
      icon: Calendar,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Commissions par partenaire */}
          <Card>
            <CardHeader>
              <CardTitle>Commissions par partenaire</CardTitle>
              <CardDescription>
                15% de commission sur chaque réservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialStats?.partnerCommissions && financialStats.partnerCommissions.length > 0 ? (
                <div className="space-y-3">
                  {financialStats.partnerCommissions.map((partner) => (
                    <div key={partner.partnerId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Partenaire {partner.partnerId.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">Commission totale</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {Math.round(partner.commission).toLocaleString()} CDF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commission générée pour le moment
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graphique (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              <CardDescription>
                Graphique des revenus sur les 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-muted-foreground">Graphique en développement</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};