/**
 * 👤 Header de profil réutilisable
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhotoUploadModal } from './PhotoUploadModal';

interface ProfileHeaderProps {
  name: string;
  photo?: string;
  rating: number;
  badge: string;
  badgeIcon: string;
  serviceType: 'taxi' | 'delivery';
}

export const ProfileHeader = ({ 
  name, 
  photo, 
  rating, 
  badge, 
  badgeIcon,
  serviceType 
}: ProfileHeaderProps) => {
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);

  const handlePhotoUploadSuccess = (url: string) => {
    setCurrentPhoto(url);
  };

  return (
    <>
      <PhotoUploadModal
        open={showPhotoModal}
        onOpenChange={setShowPhotoModal}
        currentPhoto={currentPhoto}
        onUploadSuccess={handlePhotoUploadSuccess}
      />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 service-card">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="w-20 h-20 border-4 border-primary/20">
              <AvatarImage src={currentPhoto} alt={name} />
              <AvatarFallback className="text-2xl">
                {name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            {/* Bouton modifier photo - apparaît au hover */}
            <Button
              size="icon"
              variant="secondary"
              className="absolute inset-0 m-auto w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowPhotoModal(true)}
            >
              <Camera className="w-5 h-5" />
            </Button>

            {/* Badge vérifié */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center border-2 border-background">
              <span className="text-xs">✓</span>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{name}</h2>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(rating) 
                        ? `fill-${serviceColor}-500 text-${serviceColor}-500` 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {rating.toFixed(1)}
              </span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-${serviceColor}-500 to-${serviceColor}-600 text-white text-xs font-semibold`}>
              <span>{badgeIcon}</span>
              <span>{badge}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
    </>
  );
};
