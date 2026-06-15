import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RentalFinancialData {
  totalRevenue: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  conversionRate: number;
  revenueByCategory: Array<{
    name: string;
    value: number;
    category_id: string;
  }>;
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
    bookings: number;
  }>;
  topPartners: Array<{
    partner_id: string;
    partner_name: string;
    revenue: number;
    subscriptions: number;
    bookings: number;
  }>;
}

export const useAdminRentalFinancials = (timeRange: string = '30') => {
  return useQuery({
    queryKey: ['admin-rental-financials', timeRange],
    queryFn: async (): Promise<RentalFinancialData> => {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Revenus par catégorie
      const { data: revenueByCategory } = await supabase
        .from('rental_bookings')
        .select(`
          total_amount,
          rental_vehicles (
            category_id,
            rental_vehicle_categories (
              name
            )
          )
        `)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Revenus totaux et abonnements
      const [
        { data: completedBookings },
        { data: allSubscriptions },
        { data: activeSubscriptions }
      ] = await Promise.all([
        supabase
          .from('rental_bookings')
          .select('total_amount, created_at')
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('partner_rental_subscriptions')
          .select('id, created_at')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('partner_rental_subscriptions')
          .select('id')
          .eq('status', 'active')
      ]);

      // Calculs des métriques
      const totalRevenue = completedBookings?.reduce((sum, booking) => 
        sum + (parseFloat(booking.total_amount.toString()) || 0), 0) || 0;

      const totalSubscriptions = allSubscriptions?.length || 0;
      const activeSubsCount = activeSubscriptions?.length || 0;
      const conversionRate = totalSubscriptions > 0 ? (activeSubsCount / totalSubscriptions) * 100 : 0;

      // Revenus par catégorie avec regroupement
      const categoryRevenue = new Map();
      revenueByCategory?.forEach(booking => {
        const categoryName = booking.rental_vehicles?.rental_vehicle_categories?.name || 'Autre';
        const categoryId = booking.rental_vehicles?.category_id || 'other';
        const amount = parseFloat(booking.total_amount.toString()) || 0;
        
        if (categoryRevenue.has(categoryName)) {
          categoryRevenue.set(categoryName, categoryRevenue.get(categoryName) + amount);
        } else {
          categoryRevenue.set(categoryName, amount);
        }
      });

      const revenueByCategories = Array.from(categoryRevenue.entries()).map(([name, value]) => ({
        name,
        value,
        category_id: name.toLowerCase()
      }));

      // Données temporelles (simulées pour l'instant - à améliorer avec vraies requêtes)
      const timeSeriesData = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Filtrer les données pour cette date
        const dayRevenue = completedBookings?.filter(b => 
          new Date(b.created_at).toDateString() === date.toDateString()
        ).reduce((sum, b) => sum + (parseFloat(b.total_amount.toString()) || 0), 0) || 0;
        
        const daySubscriptions = allSubscriptions?.filter(s => 
          new Date(s.created_at).toDateString() === date.toDateString()
        ).length || 0;

        timeSeriesData.push({
          date: date.toISOString().split('T')[0],
          revenue: dayRevenue,
          subscriptions: daySubscriptions,
          bookings: Math.floor(dayRevenue / 50000) // Estimation basée sur le revenu moyen
        });
      }

      // Top partenaires (données simulées - à implémenter avec vraies requêtes)
      const topPartners = [
        { partner_id: '1', partner_name: 'Partenaire Premium Auto', revenue: totalRevenue * 0.3, subscriptions: Math.floor(activeSubsCount * 0.4), bookings: Math.floor(totalRevenue * 0.3 / 50000) },
        { partner_id: '2', partner_name: 'Congo Fleet Services', revenue: totalRevenue * 0.25, subscriptions: Math.floor(activeSubsCount * 0.3), bookings: Math.floor(totalRevenue * 0.25 / 50000) },
        { partner_id: '3', partner_name: 'Kinshasa Transport Plus', revenue: totalRevenue * 0.2, subscriptions: Math.floor(activeSubsCount * 0.2), bookings: Math.floor(totalRevenue * 0.2 / 50000) },
        { partner_id: '4', partner_name: 'Eco Vehicles RDC', revenue: totalRevenue * 0.15, subscriptions: Math.floor(activeSubsCount * 0.1), bookings: Math.floor(totalRevenue * 0.15 / 50000) }
      ];

      return {
        totalRevenue,
        activeSubscriptions: activeSubsCount,
        totalSubscriptions,
        conversionRate,
        revenueByCategory: revenueByCategories,
        timeSeriesData,
        topPartners
      };
    },
    refetchInterval: 60000, // Actualiser toutes les minutes
  });
};