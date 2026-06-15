import { lazy, Suspense, useEffect, useState, memo } from 'react';
import { WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ModernHeader } from './ModernHeader';

import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { MoreServicesSheet } from './MoreServicesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useServiceNotifications } from '@/hooks/useServiceNotifications';
import { useServiceTransition } from '@/hooks/useServiceTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { useClientActiveDeliveryOrders } from '@/hooks/useClientActiveDeliveryOrders';
import { useClientActiveTransportBookings } from '@/hooks/useClientActiveTransportBookings';
import { ActiveOrdersSection } from '@/components/home/ActiveOrdersSection';

// ✅ Lazy loading des composants lourds
const ServiceGrid = lazy(() => import('./ServiceGrid').then(m => ({ default: m.ServiceGrid })));
const HomeRecentActivity = lazy(() => import('./HomeRecentActivity').then(m => ({ default: m.HomeRecentActivity })));

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  onNavigateToTestData?: () => void;
  onDeliveryTrackingOpen?: (orderId: string) => void;
}

// ✅ PHASE 4: Component optimisé avec React.memo
export const ModernHomeScreen = memo(({
  onServiceSelect,
  onSearch,
  onNavigateToTestData,
  onDeliveryTrackingOpen
}: ModernHomeScreenProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [moreServicesOpen, setMoreServicesOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { unreadCount, toasts } = useRealtimeNotifications();
  const serviceNotifications = useServiceNotifications();
  const { transitionToService } = useServiceTransition();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  
  // ✅ Hooks pour les commandes actives
  const { activeOrders, hasActiveOrders } = useClientActiveDeliveryOrders();
  const { activeBookings, hasActiveBookings } = useClientActiveTransportBookings();

  const handleToastAction = (id: string, url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  const handleToastClose = (id: string) => {
    // Le toast sera automatiquement retiré par le hook
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'activity':
        onServiceSelect('history');
        break;
      case 'profil':
        onServiceSelect('profil');
        break;
      default:
        break;
    }
  };

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  useEffect(() => {
    // Si l'utilisateur a un rôle différent de client, le rediriger vers son dashboard
    if (!roleLoading && primaryRole && primaryRole !== 'client') {
      const dashboardPaths: Record<string, string> = {
        driver: '/app/chauffeur',
        partner: '/app/partenaire',
        admin: '/operatorx/admin',
        restaurant: '/app/restaurant'
      };
      const targetPath = dashboardPaths[primaryRole] || '/app/client';
      navigate(targetPath);
    }
  }, [primaryRole, roleLoading, navigate]);

  return (
    <div className="flex flex-col" data-page="home">
      {/* Container de toasts modernes au-dessus de tout */}
      <NotificationToastContainer
        toasts={toasts}
        onClose={handleToastClose}
        onAction={handleToastAction}
        maxVisible={3}
      />
      
      {/* Header fixe - géré par ModernHeader avec position: fixed */}
      <ModernHeader />
      
      {/* Contenu principal - padding-top adaptatif pour header fixe + safe area */}
      <div className="space-y-1" style={{ paddingTop: 'var(--header-height-safe)', paddingBottom: 'var(--bottom-nav-height-safe)' }}>
        {/* ✅ Section unifiée suivi commandes actives */}
        {(hasActiveOrders || hasActiveBookings) && (
          <div className="mt-2">
            <ActiveOrdersSection
              taxiBookings={activeBookings}
              deliveryOrders={activeOrders}
              onTaxiClick={(bookingId) => onServiceSelect(`taxi-tracking:${bookingId}`)}
              onDeliveryClick={(orderId) => onDeliveryTrackingOpen?.(orderId)}
            />
          </div>
        )}
        
        {/* Bandeau offline */}
        {!isOnline && (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl bg-muted/80 border border-border px-4 py-3">
            <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Certaines fonctionnalités sont limitées hors connexion
            </p>
          </div>
        )}

        
        {/* ServiceGrid */}
        <div className="px-4 pt-3 pb-2 relative z-10">
          <Suspense fallback={
            <div className="grid grid-cols-3 gap-x-6 gap-y-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col items-center gap-3 animate-fade-in">
                  <Skeleton className="w-24 h-24 rounded-[32px]" />
                  <Skeleton className="h-[15px] w-16 rounded" />
                </div>
              ))}
            </div>
          }>
            <ServiceGrid 
              onServiceSelect={(service) => {
                if (service === 'more') {
                  setMoreServicesOpen(true);
                } else {
                  transitionToService(service);
                }
              }} 
              serviceNotifications={serviceNotifications}
            />
          </Suspense>
        </div>

        {/* Section suggestions en vedette — séparée visuellement */}
        <div className="px-4 mt-4 pt-3">
          <Suspense fallback={null}>
            <HomeRecentActivity onServiceSelect={onServiceSelect} />
          </Suspense>
        </div>
      </div>

      <MoreServicesSheet
        isOpen={moreServicesOpen}
        onClose={() => setMoreServicesOpen(false)}
        onServiceSelect={onServiceSelect}
      />
    </div>
  );
});

ModernHomeScreen.displayName = 'ModernHomeScreen';