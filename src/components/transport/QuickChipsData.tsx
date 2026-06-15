/**
 * QuickChipsData — deferred sub-component that mounts usePlaces + useSavedAddresses
 * Only rendered after CompactDestinationSearch's 2s ready delay.
 */
import { useRef, useCallback, useState } from 'react';
import { Home, Building, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaces } from '@/hooks/usePlaces';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import type { NavigateFunction } from 'react-router-dom';

interface QuickChipsDataProps {
  onOpenSearch: () => void;
  onSelectQuick?: (location: { address: string; lat: number; lng: number; name: string }) => void;
  navigate: NavigateFunction;
  toast: (opts: { title: string; variant?: string }) => void;
  triggerHaptic: () => void;
}

export default function QuickChipsData({
  onOpenSearch, onSelectQuick, navigate, toast, triggerHaptic
}: QuickChipsDataProps) {
  const { homePlace, workPlace, loading, deletePlace } = usePlaces();
  const { addresses: savedAddresses, deleteAddress } = useSavedAddresses();

  const lastTapRef = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null);

  const guardedTap = useCallback((fn: () => void) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;
    fn();
  }, []);

  const startLongPress = useCallback((id: string) => {
    longPressTimer.current = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(30);
      setLongPressTarget(id);
    }, 600);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDeleteChip = async (type: 'home' | 'work' | string) => {
    setLongPressTarget(null);
    try {
      if (type === 'home' || type === 'work') {
        const place = type === 'home' ? homePlace : workPlace;
        if (place) await deletePlace(place.id);
      } else {
        await deleteAddress(type);
      }
      toast({ title: "Adresse supprimée" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const hasValidCoords = (coords: { lat?: number; lng?: number } | undefined | null): coords is { lat: number; lng: number } => {
    if (!coords) return false;
    const { lat, lng } = coords;
    return typeof lat === 'number' && typeof lng === 'number' && !(lat === 0 && lng === 0) && !isNaN(lat) && !isNaN(lng);
  };

  const extraAddresses = savedAddresses
    .filter(addr => {
      const l = addr.label.toLowerCase();
      const isHome = l.includes('maison') || l === 'home';
      const isWork = l.includes('travail') || l.includes('bureau') || l === 'work';
      if (isHome && homePlace) return false;
      if (isWork && workPlace) return false;
      return true;
    })
    .slice(0, 2);

  const hasAnyAddress = !!homePlace || !!workPlace || extraAddresses.length > 0;

  return (
    <div onClick={() => longPressTarget && setLongPressTarget(null)}>
      <AnimatePresence mode="wait">
        {!loading && !hasAnyAddress ? (
          <motion.div
            key="add-places"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3"
          >
            <div
              role="button"
              tabIndex={0}
              onPointerUp={() => guardedTap(() => {
                navigate('/mes-adresses?add=true&from=/transport');
                triggerHaptic();
              })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-medium cursor-pointer active:bg-primary/10 active:border-primary/60 transition-all group"
              style={{ touchAction: 'manipulation' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ajouter une adresse</span>
              <Plus className="w-4 h-4" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="places-list"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1"
            style={{ touchAction: 'pan-x' }}
          >
            {homePlace && (
              <ChipItem
                id="home"
                icon={<Home className="w-3.5 h-3.5" />}
                label="Maison"
                chipClass="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/25"
                coords={homePlace.coordinates}
                address={homePlace.address}
                name={homePlace.name}
                longPressTarget={longPressTarget}
                onTap={() => {
                  if (!hasValidCoords(homePlace.coordinates)) { onOpenSearch(); return; }
                  onSelectQuick?.({ address: homePlace.address, lat: homePlace.coordinates.lat, lng: homePlace.coordinates.lng, name: homePlace.name });
                  triggerHaptic();
                }}
                onLongPressStart={() => startLongPress('home')}
                onLongPressCancel={cancelLongPress}
                onDelete={() => handleDeleteChip('home')}
                guardedTap={guardedTap}
              />
            )}

            {workPlace && (
              <ChipItem
                id="work"
                icon={<Building className="w-3.5 h-3.5 text-muted-foreground" />}
                label="Travail"
                chipClass="bg-muted/60 text-foreground border-border/30"
                coords={workPlace.coordinates}
                address={workPlace.address}
                name={workPlace.name}
                longPressTarget={longPressTarget}
                onTap={() => {
                  if (!hasValidCoords(workPlace.coordinates)) { onOpenSearch(); return; }
                  onSelectQuick?.({ address: workPlace.address, lat: workPlace.coordinates.lat, lng: workPlace.coordinates.lng, name: workPlace.name });
                  triggerHaptic();
                }}
                onLongPressStart={() => startLongPress('work')}
                onLongPressCancel={cancelLongPress}
                onDelete={() => handleDeleteChip('work')}
                guardedTap={guardedTap}
              />
            )}

            {extraAddresses.map((addr) => (
              <ChipItem
                key={addr.id}
                id={addr.id}
                icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
                label={addr.label}
                chipClass="bg-muted/60 text-foreground border-border/30"
                coords={addr.coordinates}
                address={addr.address_line}
                name={addr.label}
                longPressTarget={longPressTarget}
                onTap={() => {
                  if (!hasValidCoords(addr.coordinates)) { onOpenSearch(); return; }
                  onSelectQuick?.({ address: addr.address_line, lat: addr.coordinates.lat, lng: addr.coordinates.lng, name: addr.label });
                  triggerHaptic();
                }}
                onLongPressStart={() => startLongPress(addr.id)}
                onLongPressCancel={cancelLongPress}
                onDelete={() => handleDeleteChip(addr.id)}
                guardedTap={guardedTap}
              />
            ))}

            <div
              role="button"
              tabIndex={0}
              onPointerUp={() => guardedTap(() => {
                navigate('/mes-adresses?add=true&from=/transport');
                triggerHaptic();
              })}
              className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 active:border-primary/50 active:text-primary transition-colors flex-shrink-0 self-center cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <Plus className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Extracted chip component ──
interface ChipItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  chipClass: string;
  coords: { lat?: number; lng?: number } | undefined | null;
  address: string;
  name: string;
  longPressTarget: string | null;
  onTap: () => void;
  onLongPressStart: () => void;
  onLongPressCancel: () => void;
  onDelete: () => void;
  guardedTap: (fn: () => void) => void;
}

function ChipItem({ id, icon, label, chipClass, longPressTarget, onTap, onLongPressStart, onLongPressCancel, onDelete, guardedTap }: ChipItemProps) {
  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onPointerUp={() => { if (longPressTarget) return; guardedTap(onTap); }}
        onTouchStart={onLongPressStart}
        onTouchEnd={onLongPressCancel}
        onTouchCancel={onLongPressCancel}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium whitespace-nowrap transition-colors active:brightness-90 cursor-pointer select-none ${chipClass}`}
        style={{ touchAction: 'manipulation' }}
      >
        {icon}
        <span>{label}</span>
      </div>
      {longPressTarget === id && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onDelete}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg z-10"
        >
          <Trash2 className="w-3 h-3" />
        </motion.button>
      )}
    </div>
  );
}
