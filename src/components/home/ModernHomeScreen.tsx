import { lazy, Suspense, useEffect, useState, useRef, memo } from 'react';
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

// Bannières promo texte (carrousel auto-défilant, style TAGA vert/navy).
const PROMO_SLIDES = [
  { title: 'Bienvenue sur TAGA', subtitle: 'Votre course en quelques clics à Abidjan' },
  { title: 'Parrainez vos amis', subtitle: 'Gagnez des réductions sur vos courses' },
  { title: 'Livraison express', subtitle: 'Vos colis livrés en moto, partout à Abidjan' },
];

const PromoSlider = () => {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const count = PROMO_SLIDES.length;

  // Auto-play ~4s
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 4000);
    return () => clearInterval(id);
  }, [count]);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx > 40) setIndex((i) => (i - 1 + count) % count);
    else if (dx < -40) setIndex((i) => (i + 1) % count);
    startX.current = null;
  };

  return (
    <div className="px-4">
      <div
        className="relative overflow-hidden rounded-2xl shadow-md"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {PROMO_SLIDES.map((s, i) => (
            <div
              key={i}
              className="w-full shrink-0 p-5 pb-7 text-white"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
            >
              <p className="text-lg font-extrabold leading-tight tracking-tight">{s.title}</p>
              <p className="text-xs text-white/85 mt-1">{s.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Pagination par points */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {PROMO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à la promo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex flex-col bg-background" data-page="home">
      {/* Container de toasts modernes au-dessus de tout */}
      <NotificationToastContainer
        toasts={toasts}
        onClose={handleToastClose}
        onAction={handleToastAction}
        maxVisible={3}
      />

      {/* Header fixe - géré par ModernHeader avec position: fixed */}
      <ModernHeader />

      {/* Contenu principal - rythme vertical TAGA, padding adaptatif header fixe + safe area */}
      <div className="space-y-5" style={{ paddingTop: 'calc(var(--header-height-safe) + 16px)', paddingBottom: 'var(--bottom-nav-height-safe)' }}>
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
          <div className="mx-4 flex items-center gap-2 rounded-xl bg-muted/80 border border-border px-4 py-3">
            <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Certaines fonctionnalités sont limitées hors connexion
            </p>
          </div>
        )}

        {/* ServiceGrid */}
        <div className="px-4 relative z-10">
          <Suspense fallback={
            <div className="flex items-start justify-between gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="h-[11px] w-10 rounded" />
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

        {/* Carrousel de bannières promo texte (auto-défilant) */}
        <PromoSlider />

        {/* Section suggestions en vedette */}
        <div className="px-4">
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