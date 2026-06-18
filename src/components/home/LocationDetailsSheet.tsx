import React, { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Edit3, Share2, MapPin, ExternalLink, Check, Navigation, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeGeolocation } from '@/hooks/useRealtimeGeolocation';
import { cn } from '@/lib/utils';
import { GooglePlacesService } from '@/services/googlePlacesService';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';

// 🔍 Validation des coordonnées
const isValidCoordinates = (coords: { lat: number; lng: number } | undefined): boolean => {
  if (!coords) return false;
  const { lat, lng } = coords;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// 📐 Calcul distance Haversine (mètres)
const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 6371000;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
    Math.cos((coord2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface LocationDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  coordinates?: { lat: number; lng: number };
}

export const LocationDetailsSheet: React.FC<LocationDetailsSheetProps> = ({
  open,
  onOpenChange,
  address,
  coordinates
}) => {
  const geolocation = useRealtimeGeolocation();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(coordinates);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [savedPositions, setSavedPositions] = useState<Array<{ name: string; address: string; coordinates: { lat: number; lng: number } }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [positionName, setPositionName] = useState('');

  // Update coords when props change
  useEffect(() => {
    setCurrentCoords(coordinates);
    setCurrentAddress(address);
  }, [coordinates, address]);

  // Load saved positions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kwenda_saved_positions');
    if (saved) setSavedPositions(JSON.parse(saved));
  }, []);

  // Watch position : initialise depuis le GPS si vide, sinon met à jour si >50m
  useEffect(() => {
    if (!open || !geolocation.latitude || !geolocation.longitude) return;
    const newCoords = { lat: geolocation.latitude, lng: geolocation.longitude };

    if (currentCoords && isValidCoordinates(currentCoords)) {
      const distance = calculateDistance(currentCoords, newCoords);
      if (distance > 50) {
        setCurrentCoords(newCoords);
        GooglePlacesService.reverseGeocode(newCoords.lng, newCoords.lat)
          .then(addr => setCurrentAddress(addr))
          .catch(() => {});
      }
    } else {
      // Pas de coordonnées initiales : on initialise avec le GPS
      setCurrentCoords(newCoords);
      GooglePlacesService.reverseGeocode(newCoords.lng, newCoords.lat)
        .then(addr => setCurrentAddress(addr))
        .catch(() => {});
    }
  }, [open, geolocation.latitude, geolocation.longitude, currentCoords]);

  // 📊 Obtenir le niveau de précision GPS
  const getGpsAccuracyLevel = useCallback(() => {
    const accuracy = geolocation.accuracy;
    if (!accuracy) return null;
    if (accuracy <= 50) return { label: 'précis', color: 'bg-emerald-500', textColor: 'text-white' };
    if (accuracy <= 150) return { label: 'correct', color: 'bg-green-500', textColor: 'text-white' };
    return { label: 'approx.', color: 'bg-yellow-500', textColor: 'text-white' };
  }, [geolocation.accuracy]);

  const handleSaveLocation = () => {
    if (savedPositions.length >= 10) {
      toast({ title: "Limite atteinte", description: "Maximum 10 positions", variant: "destructive" });
      return;
    }
    setShowSaveDialog(true);
  };

  const confirmSaveLocation = () => {
    if (!currentCoords || !isValidCoordinates(currentCoords)) {
      toast({ title: "❌ Position invalide", variant: "destructive" });
      return;
    }
    
    const name = positionName.trim() || `Position ${savedPositions.length + 1}`;
    const updated = [...savedPositions, { name, address: currentAddress, coordinates: currentCoords }];
    setSavedPositions(updated);
    localStorage.setItem('kwenda_saved_positions', JSON.stringify(updated));
    toast({ title: "✅ Position enregistrée" });
    setPositionName('');
    setShowSaveDialog(false);
  };

  const handleEditLocation = () => {
    setIsEditing(!isEditing);
    if (navigator.vibrate) navigator.vibrate(10);

    if (!isEditing) {
      toast({ title: "📍 Mode édition activé", description: "Touchez la carte pour ajuster votre position." });
    } else {
      toast({ title: "✅ Position modifiée" });
    }
  };

  const handleDeletePosition = (index: number) => {
    const updated = savedPositions.filter((_, i) => i !== index);
    setSavedPositions(updated);
    localStorage.setItem('kwenda_saved_positions', JSON.stringify(updated));
    toast({ title: "🗑️ Position supprimée" });
  };

  const handleShareLocation = async () => {
    if (!currentCoords || !isValidCoordinates(currentCoords)) {
      toast({ title: "❌ Partage impossible", variant: "destructive" });
      return;
    }

    const shareUrl = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
    const shareText = `📍 Ma position TAGA\n${currentAddress}\n\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ma position TAGA', text: shareText });
        toast({ title: "📤 Partagé avec succès" });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareText);
          toast({ title: "📋 Copié !" });
        }
      }
    } else {
      navigator.clipboard?.writeText(shareText);
      toast({ title: "📋 Copié !" });
    }
  };

  const openInGoogleMaps = () => {
    if (currentCoords) {
      window.open(`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`, '_blank');
    }
  };

  const gpsLevel = getGpsAccuracyLevel();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header simplifié */}
          <SheetHeader className="space-y-1 pb-3 border-b border-border/30">
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-bold">
                {isEditing ? 'Modifier la position' : 'Ma position'}
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Warning si pas de GPS */}
          {open && (!coordinates || !isValidCoordinates(coordinates)) && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ Position GPS non disponible
              </p>
            </div>
          )}

          <div className="space-y-4 mt-4">
            {/* Carte */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-muted/30 border border-border/30">
              {currentCoords && isValidCoordinates(currentCoords) ? (
                <GoogleMapsKwenda
                  center={currentCoords}
                  height="224px"
                  zoom={16}
                  onLocationSelect={isEditing ? (loc) => {
                    if (navigator.vibrate) navigator.vibrate(15);
                    setCurrentCoords({ lat: loc.lat, lng: loc.lng });
                    setCurrentAddress(loc.address);
                  } : undefined}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <div className="flex flex-col items-center gap-2 px-4 text-center">
                    <Navigation className="w-6 h-6 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      En attente de votre position GPS...
                    </p>
                  </div>
                </div>
              )}

              {/* Badge GPS dynamique avec pulse */}
              {geolocation?.isRealGPS && gpsLevel && currentCoords && isValidCoordinates(currentCoords) && (
                <div className={cn(
                  "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold",
                  "flex items-center gap-1.5 shadow-lg backdrop-blur-md z-10",
                  gpsLevel.color, gpsLevel.textColor
                )}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  GPS {gpsLevel.label} ({Math.round(geolocation.accuracy || 0)}m)
                </div>
              )}

              {/* Bouton Google Maps */}
              {currentCoords && isValidCoordinates(currentCoords) && (
                <Button
                  size="sm"
                  onClick={openInGoogleMaps}
                  className="absolute top-3 right-3 h-7 gap-1 text-[10px] text-foreground bg-background/80 backdrop-blur-md border border-border/40 shadow-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir
                </Button>
              )}
            </div>

            {/* Adresse */}
            <div className="rounded-xl bg-muted/20 border border-border/20 p-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider mb-0.5">
                    {isEditing ? 'Nouvelle adresse' : 'Adresse actuelle'}
                  </p>
                  <p className="text-xs font-medium text-foreground leading-relaxed line-clamp-2">
                    {currentAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog sauvegarde */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/30 rounded-xl p-3 space-y-2 border border-primary/20">
                    <p className="text-xs font-semibold">Nom (optionnel)</p>
                    <Input
                      placeholder="Ex: Maison, Bureau..."
                      value={positionName}
                      onChange={(e) => setPositionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmSaveLocation()}
                      className="h-9 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={confirmSaveLocation} size="sm" className="flex-1 h-9 gap-1">
                        <Check className="h-3.5 w-3.5" /> Confirmer
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowSaveDialog(false); setPositionName(''); }} className="flex-1 h-9">
                        Annuler
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🚀 ACTIONS COMPACTES EN LIGNE */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 gap-1.5 text-xs"
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); handleSaveLocation(); }}
              >
                <Bookmark className="h-4 w-4 text-red-500" />
                Sauver
              </Button>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                className="flex-1 h-10 gap-1.5 text-xs"
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); handleEditLocation(); }}
              >
                <Edit3 className="h-4 w-4 text-blue-500" />
                {isEditing ? 'OK' : 'Modifier'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 gap-1.5 text-xs"
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); handleShareLocation(); }}
              >
                <Share2 className="h-4 w-4 text-green-500" />
                Partager
              </Button>
            </div>

            {/* Positions sauvegardées */}
            {savedPositions.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <p className="text-xs font-semibold text-muted-foreground">
                  Positions enregistrées ({savedPositions.length}/10)
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {savedPositions.map((pos, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/20 group"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{pos.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{pos.address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePosition(index)}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
