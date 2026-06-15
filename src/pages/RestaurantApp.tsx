import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, User, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { VendorBackToTop } from '@/components/vendor/VendorBackToTop';

// Composants
import { RestaurantMobileTabs } from '@/components/restaurant/RestaurantMobileTabs';
import { RestaurantSidebar } from '@/components/restaurant/RestaurantSidebar';
import RestaurantDashboard from '@/pages/restaurant/RestaurantDashboard';
import RestaurantOrders from '@/pages/restaurant/RestaurantOrders';
import RestaurantMenuManager from '@/pages/restaurant/RestaurantMenuManager';
import { RestaurantAnalytics } from '@/components/restaurant/RestaurantAnalytics';
import RestaurantWalletPage from '@/pages/restaurant/RestaurantWalletPage';
import { RestaurantProfilePage } from '@/components/restaurant/RestaurantProfilePage';
import RestaurantSubscriptionPage from '@/pages/restaurant/RestaurantSubscriptionPage';
import { POSHub } from '@/components/restaurant/pos/POSHub';
import { POSProLock } from '@/components/restaurant/pos/POSProLock';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { JobsManagerDashboard } from '@/components/job/publisher/JobsManagerDashboard';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile' | 'subscription' | 'pos' | 'jobs';

export default function RestaurantApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<RestaurantTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const { canAccessPOS, isInTrial, trialDaysRemaining, isLoading: subscriptionLoading } = useSubscriptionAccess(restaurantId);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'orders', 'menu', 'analytics', 'wallet', 'profile', 'subscription', 'pos', 'jobs'].includes(tab)) {
      setCurrentTab(tab as RestaurantTab);
    }
  }, [searchParams]);

  // Scroll to top on tab change
  useEffect(() => {
    if (mainRef.current) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mainRef.current.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }, [currentTab]);

  useEffect(() => {
    checkRestaurantProfile();
  }, []);

  const checkRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('restaurant_profiles')
        .select('id, verification_status, is_active, restaurant_name')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        toast({
          title: 'Profil manquant',
          description: 'Veuillez créer votre profil restaurant',
          variant: 'destructive',
        });
        navigate('/restaurant/auth');
        return;
      }

      setRestaurantId(profile.id);
      setRestaurantName(profile.restaurant_name || '');

      // Charger les commandes en attente
      const { data: orders } = await supabase
        .from('food_orders')
        .select('id')
        .eq('restaurant_id', profile.id)
        .in('status', ['pending', 'confirmed']);

      setPendingOrders(orders?.length || 0);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: RestaurantTab) => {
    setCurrentTab(tab);
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <RestaurantDashboard />;
      case 'orders':
        return <RestaurantOrders />;
      case 'menu':
        return <RestaurantMenuManager />;
      case 'analytics':
        return <RestaurantAnalytics restaurantId={restaurantId!} />;
      case 'wallet':
        return <RestaurantWalletPage />;
      case 'profile':
        return <RestaurantProfilePage />;
      case 'subscription':
        return <RestaurantSubscriptionPage />;
      case 'pos':
        if (!canAccessPOS) {
          return <POSProLock onUpgrade={() => handleTabChange('subscription')} trialExpired={trialDaysRemaining === 0} />;
        }
        return <POSHub restaurantId={restaurantId!} isInTrial={isInTrial} trialDaysRemaining={trialDaysRemaining} />;
      case 'jobs':
        return (
          <JobsManagerDashboard 
            userType="restaurant"
            defaultCompanyData={{
              name: restaurantName,
              description: 'Restaurant sur Tembea Food',
              city: 'Kinshasa'
            }}
          />
        );
      default:
        return <RestaurantDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Header Unifié Modern - Mobile uniquement */}
      <header className="flex-shrink-0 md:hidden border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pt-safe-top">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo + Nom */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-base tracking-tight">Tembea Food</span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <UnifiedNotificationBell userType="restaurant" />
            <ThemeToggle />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-medium">
                      {user?.email?.[0]?.toUpperCase() || 'R'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{restaurantName || 'Mon Restaurant'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTabChange('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange('profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Container principal avec sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <RestaurantSidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          restaurantName={restaurantName}
          pendingOrders={pendingOrders}
        />

        {/* Contenu principal */}
        <main ref={mainRef} className="flex-1 overflow-y-auto smooth-scroll pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            {renderContent()}
          </div>
          <VendorBackToTop scrollContainerRef={mainRef} />
        </main>
      </div>

      {/* Footer - Tabs Mobile uniquement */}
      <footer className="flex-shrink-0 md:hidden">
        <RestaurantMobileTabs currentTab={currentTab} onTabChange={handleTabChange} />
      </footer>
    </div>
  );
}
