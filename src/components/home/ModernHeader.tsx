import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { SeasonalThemeSelector } from '@/components/theme/SeasonalThemeSelector';
import { LocationDetailsSheet } from './LocationDetailsSheet';
import { NotificationCenter } from '@/components/lottery/notifications/NotificationCenter';
import { useSeasonalThemeSafe } from '@/contexts/SeasonalThemeContext';

interface ModernHeaderProps {}

export const ModernHeader = ({}: ModernHeaderProps) => {
  let t: (key: string) => string;
  let language: string;

  try {
    const languageContext = useLanguage();
    t = languageContext.t;
    language = languageContext.language;
  } catch {
    t = (key: string) => key;
    language = 'fr';
  }

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const { displayName, loading: profileLoading } = useProfile();
  const { currentSeason } = useSeasonalThemeSafe();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (currentSeason === 'christmas') return '🎄 Noël';
    if (currentSeason === 'newYear') return '🎆 2026';
    if (currentSeason === 'valentine') return '💝 St-Val';
    if (hour >= 18 || hour < 6) return 'Bonsoir';
    if (hour >= 12) return 'Bon après-midi';
    return 'Bonjour';
  };

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setCurrentAddress(t('location.unavailable'));
      return;
    }

    setGeocodingLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCoords({ lat, lng });

        try {
          const { GeocodingService } = await import('@/services/geocoding');
          const address = await GeocodingService.reverseGeocode(lng, lat);
          if (!cancelled) {
            const generic = ['Position actuelle', 'Ma position', 'Current position', 'My position'];
            const isGeneric = !address || generic.some(g => address.toLowerCase() === g.toLowerCase());
            setCurrentAddress(isGeneric ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : address);
          }
        } catch {
          if (!cancelled) setCurrentAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          if (!cancelled) setGeocodingLoading(false);
        }
      },
      (err) => {
        if (!cancelled) {
          console.warn('ModernHeader GPS:', err.message);
          setCurrentAddress(t('location.unavailable'));
          setGeocodingLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => { cancelled = true; };
  }, []);

  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-height', `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} id="main-header" className="fixed top-0 left-0 right-0 z-[150] bg-background/95 backdrop-blur-xl border-b border-border/20" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 min-h-[48px]">
          {/* Zone gauche: Greeting + Nom + Position */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider whitespace-nowrap">
                {getGreeting()}
              </span>
              <span className="text-lg font-extrabold text-foreground truncate max-w-[130px] leading-tight">
                {profileLoading ? '...' : displayName.split(' ')[0]}
              </span>
            </div>

            {/* Position: toujours visible, montre l'adresse ou le statut */}
            <button
              onClick={() => setLocationSheetOpen(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <MapPin className="h-2.5 w-2.5 text-primary/60 shrink-0" />
              <span className="truncate max-w-[160px]">
                {geocodingLoading
                  ? t('client.locating')
                  : currentAddress || t('client.my_position')}
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-primary/40" />
            </button>
          </div>

          {/* Zone droite: Icônes */}
          <div className="flex items-center gap-1 bg-muted/40 backdrop-blur-sm rounded-2xl px-2 py-1.5 border border-border/15 shadow-sm">
            <NotificationCenter />
            <div className="w-px h-4 bg-border/20" />
            <SeasonalThemeSelector />
          </div>
        </div>
      </div>

      <LocationDetailsSheet
        open={locationSheetOpen}
        onOpenChange={setLocationSheetOpen}
        address={currentAddress || t('location.unavailable')}
        coordinates={gpsCoords ?? undefined}
      />
    </header>
  );
};
