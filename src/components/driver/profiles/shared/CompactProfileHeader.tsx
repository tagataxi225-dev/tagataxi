/**
 * 🎨 Header Compact Profil Chauffeur - Design Modern & Épuré
 */

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Settings, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhotoUploadModal } from './PhotoUploadModal';

interface CompactProfileHeaderProps {
  name: string;
  photo?: string | null;
  rating: number;
  city?: string;
  badge: string;
  badgeIcon: string;
  serviceType: 'taxi' | 'delivery';
  isOnline?: boolean;
  onSettingsClick?: () => void;
}

export const CompactProfileHeader = ({
  name,
  photo,
  rating,
  city = 'Kinshasa',
  badgeIcon,
  serviceType,
  isOnline = true,
  onSettingsClick
}: CompactProfileHeaderProps) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);

  const themeColor = serviceType === 'taxi' ? 'text-primary' : 'text-green-500';
  const themeBg = serviceType === 'taxi' ? 'bg-primary/10' : 'bg-green-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 bg-card border border-border/50"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar 
            className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-border cursor-pointer"
            onClick={() => setShowPhotoModal(true)}
          >
            <AvatarImage src={currentPhoto || undefined} alt={name} />
            <AvatarFallback className={`${themeBg} ${themeColor} font-semibold`}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Online indicator */}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : '4.5'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{city}</span>
            <span>•</span>
            <span>{badgeIcon}</span>
            <span>{serviceType === 'taxi' ? 'Taxi' : 'Livraison'}</span>
          </div>
        </div>

        {/* Settings Button Only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted"
          onClick={onSettingsClick}
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <PhotoUploadModal 
        open={showPhotoModal}
        onOpenChange={setShowPhotoModal}
        onUploadSuccess={(newUrl) => setCurrentPhoto(newUrl)}
      />
    </motion.div>
  );
};
