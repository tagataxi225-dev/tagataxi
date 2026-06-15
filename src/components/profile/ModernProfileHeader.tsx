import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Camera, Star, User, Car, Building, Crown, Mail, Phone, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { motion } from 'framer-motion';

interface ModernProfileHeaderProps {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    user_type: string;
  };
  user: {
    email?: string;
  };
  rating?: {
    rating: number;
    total_ratings: number;
  };
  onEditName?: () => void;
  onEditPhone?: () => void;
  onBack?: () => void;
  className?: string;
}

export const ModernProfileHeader = ({
  profile,
  user,
  rating,
  onEditName,
  onEditPhone,
  onBack,
  className
}: ModernProfileHeaderProps) => {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile.avatar_url);
  const [showUpload, setShowUpload] = useState(false);

  const getUserTypeConfig = (userType: string) => {
    switch (userType) {
      case 'driver': 
        return { label: 'Conducteur', icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
      case 'partner': 
        return { label: 'Partenaire', icon: Building, color: 'text-amber-600', bg: 'bg-amber-500/10' };
      case 'premium': 
        return { label: 'Premium', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-400/10' };
      default:
        return { label: 'Client', icon: User, color: 'text-white', bg: 'bg-rose-500' };
    }
  };

  const userTypeConfig = getUserTypeConfig(profile.user_type);
  const TypeIcon = userTypeConfig.icon;

  const handleAvatarUpload = (newUrl: string) => {
    setCurrentAvatarUrl(newUrl);
    setShowUpload(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Navigation bar intégrée */}
      <div className="flex items-center gap-3 px-4 py-1">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-foreground">Mon Profil</h1>
      </div>

      {/* Card sobre - Design soft moderne */}
      <Card className="bg-card border border-border/40 rounded-2xl shadow-sm p-2.5 mx-4">
        <div className="flex items-center gap-3">
          {/* Avatar compact */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group shrink-0"
          >
            <Avatar className="w-16 h-16 ring-2 ring-red-500 shadow-sm">
              <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Overlay camera au hover */}
            <motion.div 
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowUpload(!showUpload)}
            >
              <Camera className="h-5 w-5 text-white" />
            </motion.div>
            
            {/* Badge statut fixe (pas d'animation) */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
          </motion.div>

          {/* Infos utilisateur */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Nom + Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <div className="flex items-center gap-1.5 group/name">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
                </h1>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onEditName}
                  className="p-1 h-6 w-6 opacity-0 group-hover/name:opacity-100 text-muted-foreground hover:bg-muted/50 transition-all rounded-full"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Badge type soft */}
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                userTypeConfig.bg,
                userTypeConfig.color
              )}>
                <TypeIcon className="h-3 w-3" />
                {userTypeConfig.label}
              </span>

              {/* Rating inline */}
              {rating && rating.total_ratings > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {rating.rating.toFixed(1)}
                </span>
              )}
            </motion.div>

            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </motion.div>

            {/* Téléphone */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground group/phone"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {profile.phone_number || "Ajouter un numéro"}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditPhone}
                className="p-1 h-5 w-5 opacity-0 group-hover/phone:opacity-100 text-muted-foreground hover:bg-muted/50 transition-all rounded-full ml-auto"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Upload component */}
      {showUpload && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10"
        >
          <Card className="bg-card border border-border/40 rounded-xl shadow-lg p-3">
            <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
          </Card>
        </motion.div>
      )}
    </div>
  );
};
