import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface LocationShareButtonProps {
  onShareLocation: (location: { latitude: number; longitude: number; accuracy?: number }) => Promise<void>;
  variant?: 'icon' | 'full';
  className?: string;
}

export const LocationShareButton: React.FC<LocationShareButtonProps> = ({
  onShareLocation,
  variant = 'icon',
  className = '',
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShareLocation = async () => {
    setIsSharing(true);

    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      await onShareLocation({
        latitude: position.lat,
        longitude: position.lng,
        accuracy: position.accuracy,
      });

      toast.success('📍 Position partagée');
    } catch (error: any) {
      console.error('Erreur géolocalisation:', error);
      toast.error(error.message || 'Impossible de récupérer votre position');
    } finally {
      setIsSharing(false);
    }
  };

  if (variant === 'full') {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleShareLocation}
          disabled={isSharing}
          variant="outline"
          className={`flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 ${className}`}
        >
          {isSharing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Localisation...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              <span>Partager ma position</span>
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={handleShareLocation}
        disabled={isSharing}
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 ${className}`}
        title="Partager ma position"
      >
        {isSharing ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
        ) : (
          <MapPin className="h-4.5 w-4.5" />
        )}
      </Button>
    </motion.div>
  );
};

export default LocationShareButton;
