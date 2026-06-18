import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plus, Package, DollarSign, Star, Clock, Bell, ChefHat, Store, Share2, TrendingUp, Eye, Lock, ArrowRight, Briefcase } from 'lucide-react';
import { useFoodOrders } from '@/hooks/useFoodOrders';
import { useRestaurantSubscription } from '@/hooks/useRestaurantSubscription';
import { useFoodNotifications } from '@/hooks/useFoodNotifications';
import { RestaurantShareButtons } from '@/components/food/RestaurantShareButtons';
import { RestaurantWalletCard } from '@/components/restaurant/RestaurantWalletCard';
import { useRestaurantWallet } from '@/hooks/useRestaurantWallet';
import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

interface RestaurantStats {
  todayOrders: number;
  todayRevenue: number;
  avgRating: number;
  pendingOrders: number;
  pendingEscrow: number;
}

interface RestaurantProfile {
  id: string;
  restaurant_name: string;
  city: string;
  rating_average?: number;
  cuisine_types?: string[];
}

export default function ModernRestaurantDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [menuCount, setMenuCount] = useState(0);
  const [stats, setStats] = useState<RestaurantStats>({
    todayOrders: 0,
    todayRevenue: 0,
    avgRating: 0,
    pendingOrders: 0,
    pendingEscrow: 0,
  });

  const { activeSubscription, checkExpirationWarning } = useRestaurantSubscription();
  const { subscribeToOrders } = useFoodOrders();
  const { wallet, getMonthlyStats } = useRestaurantWallet();
  
  const monthlyStats = getMonthlyStats();
  
  useFoodNotifications(restaurantId || undefined);

  const handleRefresh = useCallback(async () => {
    await loadRestaurantData();
  }, []);

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Profil manquant',
            description: 'Créez votre profil restaurant',
            variant: 'destructive',
          });
          navigate('/restaurant/setup');
        }
        throw error;
      }

      setRestaurantId(profile.id);
      setRestaurantProfile({
        id: profile.id,
        restaurant_name: profile.restaurant_name,
        city: profile.city,
        rating_average: profile.rating_average,
        cuisine_types: profile.cuisine_types
      });

      const { data: menuData } = await supabase
        .from('food_products')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', profile.id)
        .eq('is_available', true);
      
      setMenuCount(menuData?.length || 0);

      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('food_orders')
        .select('total_amount, status, payment_status')
        .eq('restaurant_id', profile.id)
        .gte('created_at', today);

      const todayRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const pendingOrders = orders?.filter(o => ['pending', 'confirmed'].includes(o.status)).length || 0;

      // Calculate pending escrow (paid orders not yet delivered)
      const { data: escrowData } = await supabase
        .from('escrow_transactions')
        .select('seller_amount')
        .eq('seller_id', user.id)
        .eq('status', 'held');
      
      const pendingEscrow = escrowData?.reduce((sum, e) => sum + (e.seller_amount || 0), 0) || 0;

      setStats({
        todayOrders: orders?.length || 0,
        todayRevenue,
        avgRating: profile.rating_average || 0,
        pendingOrders,
        pendingEscrow,
      });

    } catch (error: any) {
      console.error('Error loading restaurant data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = subscribeToOrders(
      restaurantId,
      () => loadRestaurantData(),
      () => loadRestaurantData()
    );

    return unsubscribe;
  }, [restaurantId]);

  const subscriptionWarning = activeSubscription 
    ? checkExpirationWarning(activeSubscription)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Commandes aujourd\'hui',
      value: stats.todayOrders,
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Revenus du jour',
      value: `${stats.todayRevenue.toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Note moyenne',
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'En attente',
      value: stats.pendingOrders,
      icon: Bell,
      color: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badge: stats.pendingOrders > 0,
    },
  ];

  // handleRefresh moved above early return

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
    <div className="space-y-6">
        {/* Header avec gradient */}
      {/* Header soft-modern */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/40 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {restaurantProfile?.restaurant_name || 'Dashboard Restaurant'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez votre restaurant TAGA Food
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {restaurantProfile && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/food/restaurant/${restaurantProfile.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir ma boutique
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <RestaurantShareButtons
                      restaurantId={restaurantProfile.id}
                      restaurantName={restaurantProfile.restaurant_name}
                      menuCount={menuCount}
                      rating={restaurantProfile.rating_average || 0}
                      city={restaurantProfile.city}
                      cuisineType={restaurantProfile.cuisine_types?.[0]}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}
            <Button size="sm" onClick={() => navigate('/restaurant?tab=menu')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau plat
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Message bienvenue */}
      {stats.todayOrders === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-primary" />
                Bienvenue sur TAGA Food !
              </CardTitle>
              <CardDescription>
                Voici les prochaines étapes pour commencer à recevoir des commandes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge>1</Badge>
                <div>
                  <p className="font-medium">Complétez votre profil</p>
                  <p className="text-sm text-muted-foreground">
                    Logo, horaires, zones de livraison
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge>2</Badge>
                <div>
                  <p className="font-medium">Ajoutez votre menu</p>
                  <p className="text-sm text-muted-foreground">
                    Minimum 5 plats avec photos
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/restaurant?tab=menu')}
                  >
                    Gérer mon menu →
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge>3</Badge>
                <div>
                  <p className="font-medium">Choisissez votre abonnement</p>
                  <p className="text-sm text-muted-foreground">
                    Plans dès 50 000 CDF/mois
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/restaurant/subscription')}
                  >
                    Voir les plans →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section Wallet + Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RestaurantWalletCard
          balance={wallet?.balance || 0}
          bonusBalance={wallet?.bonus_balance || 0}
          monthlySpent={monthlyStats.spent}
          monthlyRecharged={monthlyStats.recharged}
          onRecharge={() => navigate('/restaurant/wallet')}
        />

        {activeSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Abonnement actif</p>
                    <h3 className="text-2xl font-bold">{activeSubscription.plan.name}</h3>
                  </div>
                  <Badge className="bg-green-500">Actif</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expire le</span>
                    <span className="font-medium">
                      {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-medium">{activeSubscription.plan.commission_rate}%</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/restaurant/subscription')}
                  className="w-full"
                  variant="outline"
                >
                  Gérer mon abonnement
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Widget Escrow - Revenus en attente */}
      {stats.pendingEscrow > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                    <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus en attente</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats.pendingEscrow.toLocaleString()} CDF
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Fonds sécurisés • Auto-libération 48h après livraison
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  onClick={() => navigate('/restaurant/escrow')}
                >
                  Voir détails
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alerte abonnement */}
      {subscriptionWarning?.isExpiring && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-warning bg-warning/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Abonnement expire bientôt
              </CardTitle>
              <CardDescription>
                Il reste {subscriptionWarning.daysRemaining} jours. Renouvelez maintenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/restaurant/subscription')}>
                Renouveler maintenant
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards avec animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden transition-all hover:shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>{stat.title}</span>
                    {stat.badge && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Actions rapides - icônes rondes */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { icon: Package, label: 'Commandes', path: '/restaurant?tab=orders' },
          { icon: ChefHat, label: 'Menu', path: '/restaurant?tab=menu' },
          { icon: Lock, label: 'Escrow', path: '/restaurant/escrow' },
          { icon: DollarSign, label: 'Caisse', path: '/restaurant?tab=pos' },
          { icon: Briefcase, label: 'Jobs', path: '/restaurant?tab=jobs' },
        ].map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="p-3 rounded-full bg-muted/60 group-hover:bg-primary/10 transition-colors">
                <ActionIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </PullToRefresh>
  );
}
