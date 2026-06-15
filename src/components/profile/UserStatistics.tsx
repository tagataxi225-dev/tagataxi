import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Package, CreditCard, Clock, MapPin, Award, TrendingUp } from 'lucide-react';

interface UserStats {
  totalBookings: number;
  totalDeliveries: number;
  totalTransactions: number;
  totalSpent: number;
  averageRating: number;
  completedTrips: number;
  favoriteDestination: string;
  memberSince: string;
}

export const UserStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalBookings: 0,
    totalDeliveries: 0,
    totalTransactions: 0,
    totalSpent: 0,
    averageRating: 0,
    completedTrips: 0,
    favoriteDestination: 'Kinshasa',
    memberSince: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    try {
      // Load transport bookings
      const { data: bookings } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user?.id);

      // Load deliveries
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('user_id', user?.id);

      // Load payment transactions
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user?.id);

      // Load user ratings
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user?.id);

      // Load profile for member since date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user?.id)
        .single();

      // Calculate statistics
      const totalBookings = bookings?.length || 0;
      const totalDeliveries = deliveries?.length || 0;
      const totalTransactions = transactions?.length || 0;
      const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const completedTrips = (bookings?.filter(b => b.status === 'completed').length || 0) +
                            (deliveries?.filter(d => d.status === 'completed').length || 0);
      
      let averageRating = 0;
      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((total, r) => total + r.rating, 0);
        averageRating = Math.round((sum / ratings.length) * 10) / 10;
      }

      // Find most frequent destination
      const destinations = bookings?.map(b => b.destination) || [];
      const destinationCounts = destinations.reduce((acc, dest) => {
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const favoriteDestination = Object.keys(destinationCounts).length > 0
        ? Object.keys(destinationCounts).reduce((a, b) => 
            destinationCounts[a] > destinationCounts[b] ? a : b
          )
        : 'Kinshasa';

      setStats({
        totalBookings,
        totalDeliveries,
        totalTransactions,
        totalSpent,
        averageRating,
        completedTrips,
        favoriteDestination,
        memberSince: profile?.created_at || '',
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Car className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
                <p className="text-sm text-muted-foreground">Réservations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
                <p className="text-sm text-muted-foreground">Livraisons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total dépensé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trajets terminés</span>
              <Badge variant="secondary">{stats.completedTrips}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transactions totales</span>
              <Badge variant="secondary">{stats.totalTransactions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Membre depuis</span>
              <Badge variant="outline">{formatDate(stats.memberSince)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Préférences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Destination favorite</span>
              <Badge variant="secondary">{stats.favoriteDestination}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service préféré</span>
              <Badge variant="secondary">
                {stats.totalBookings > stats.totalDeliveries ? 'Transport' : 'Livraison'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badges et réalisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.totalBookings >= 5 && (
              <div className="text-center p-4 border rounded-lg">
                <Car className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Voyageur régulier</p>
                <p className="text-xs text-muted-foreground">5+ réservations</p>
              </div>
            )}
            
            {stats.totalDeliveries >= 3 && (
              <div className="text-center p-4 border rounded-lg">
                <Package className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Expéditeur actif</p>
                <p className="text-xs text-muted-foreground">3+ livraisons</p>
              </div>
            )}
            
            {stats.averageRating >= 4.5 && (
              <div className="text-center p-4 border rounded-lg">
                <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm font-medium">Client exemplaire</p>
                <p className="text-xs text-muted-foreground">Note 4.5+</p>
              </div>
            )}
            
            {stats.totalSpent >= 50000 && (
              <div className="text-center p-4 border rounded-lg">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium">VIP</p>
                <p className="text-xs text-muted-foreground">50k+ CDF dépensés</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};