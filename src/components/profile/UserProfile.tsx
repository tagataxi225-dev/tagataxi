import { useState, useEffect } from 'react';
import { AppFeedbackSection } from '@/components/shared/AppFeedbackSection';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Star, Shield, Phone, Mail, User, FileText, Wallet, UserCheck, Edit2, Check, X, ChevronRight, Settings, Car, Users, MapPin, Clock, Gift, Headphones, Store, ArrowLeft, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MobileProfileModal } from './MobileProfileModal';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { UserVerification } from './UserVerification';
import { UserRatings } from './UserRatings';
import { UserStatistics } from './UserStatistics';
import { ActivityHistory } from './ActivityHistory';
import { ClientWalletPanel } from '../client/ClientWalletPanel';
// import { ReferralPanel } from './ReferralPanel'; // Supprimé - voir ReferralDashboard
import { useOptimizedProfile } from '@/hooks/useOptimizedProfile';
import { PromoCodePanel } from './PromoCodePanel';
import { UserAddressesManager } from './UserAddressesManager';
import CustomerSupport from './CustomerSupport';
import { useNavigate } from 'react-router-dom';
import { DriverUpgrade } from './DriverUpgrade';
import { TeamAccountManager } from './TeamAccountManager';
import { UserSettings } from './UserSettings';

import { ModernProfileHeader } from './ModernProfileHeader';
import { ProfileActionButtons } from './ProfileActionButtons';
import { useIsVendor } from '@/hooks/useIsVendor';
import { VendorVerificationRequest } from '@/components/vendor/VendorVerificationRequest';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  user_type: string;
  bio?: string | null;
  cover_url?: string | null;
  created_at?: string;
  is_public?: boolean;
  is_verified_seller?: boolean;
  last_seen?: string | null;
  updated_at?: string;
}

interface UserRating {
  rating: number;
  total_ratings: number;
}

interface UserProfileProps {
  onWalletAccess?: () => void;
  onViewChange?: (view: string) => void;
  onClose?: () => void;
}

export const UserProfile = ({ onWalletAccess, onViewChange, onClose }: UserProfileProps = {}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // ✅ Utiliser le hook optimisé avec cache
  const { profile: cachedProfile, rating, loading, refreshProfile } = useOptimizedProfile();
  const [profile, setProfile] = useState(cachedProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    phone_number: '',
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeOption, setActiveOption] = useState('');
  const [showPromoPanel, setShowPromoPanel] = useState(false);
  const { isVendor } = useIsVendor();

  // ✅ Synchroniser le profil du cache avec le state local
  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
      setFormData({
        display_name: cachedProfile.display_name || '',
        phone_number: cachedProfile.phone_number || '',
      });
    }
  }, [cachedProfile]);

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: t('profile.updated'),
        description: t('profile.updated_desc'),
      });

      setIsEditing(false);
      refreshProfile(); // ✅ Utiliser refreshProfile au lieu de loadProfile
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.error_update'),
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  const handleNameSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editedDisplayName })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, display_name: editedDisplayName } : null);
      setIsEditingName(false);
      toast({
        title: t('profile.name_updated'),
        description: t('profile.name_updated_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.error_update_name'),
        variant: "destructive",
      });
    }
  };

  const handlePhoneSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: editedPhone })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, phone_number: editedPhone } : null);
      setIsEditingPhone(false);
      toast({
        title: t('profile.phone_updated'),
        description: t('profile.phone_updated_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.error_update_phone'),
        variant: "destructive",
      });
    }
  };

  const handleNameCancel = () => {
    setEditedDisplayName(profile?.display_name || '');
    setIsEditingName(false);
  };

  const handlePhoneCancel = () => {
    setEditedPhone(profile?.phone_number || '');
    setIsEditingPhone(false);
  };


  const handleOptionClick = (option: string) => {
    if (option === 'promocode') { setShowPromoPanel(true); return; }
    if (option === 'addresses') { navigate('/mes-adresses'); return; }
    if (option === 'vendor') { navigate('/vendeur'); return; }
    setActiveOption(option);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen">
        {/* Header skeleton */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-muted rounded animate-pulse w-32" />
              <div className="h-4 bg-muted rounded animate-pulse w-48" />
            </div>
          </div>
        </div>
        
        {/* Actions skeleton */}
        <div className="px-4 py-6 grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        
        {/* Options skeleton */}
        <div className="px-4 space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('profile.loading')}</p>
          <p className="text-sm text-muted-foreground">
            {t('profile.loading')}
          </p>
        </div>
      </div>
    );
  }

  const profileOptions = [
    {
      id: 'addresses',
      icon: MapPin,
      title: t('profile.addresses'),
      subtitle: t('profile.addresses'),
      hasArrow: true
    },
    {
      id: 'support',
      icon: Headphones,
      title: t('profile.support'),
      subtitle: t('support.title'),
      hasArrow: true
    },
    {
      id: 'settings',
      icon: Settings,
      title: t('profile.settings'),
      subtitle: t('profile.settings'),
      hasArrow: true
    },
    {
      id: 'logout',
      icon: LogOut,
      title: 'Se déconnecter',
      subtitle: 'Quitter votre compte',
      hasArrow: false,
      isDestructive: true
    }
  ];

  const renderModalContent = () => {
    try {
      switch (activeOption) {
        case 'wallet':
          return <ClientWalletPanel />;
        case 'referral':
          return <div className="p-6 text-center text-muted-foreground">Parrainage temporairement indisponible</div>;
        case 'promocode':
          return null;
        case 'history':
          return <ActivityHistory />;
        case 'addresses':
          return null;
        case 'vendor':
          return null;
        case 'vendor-request':
          return <VendorVerificationRequest />;
        case 'support':
          return <CustomerSupport />;
        case 'security':
          return <UserVerification />;
        case 'driver':
          return <DriverUpgrade />;
        case 'team':
          return <TeamAccountManager />;
        case 'settings':
          return <UserSettings />;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering modal content:', error);
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Une erreur s'est produite lors du chargement.</p>
          <button 
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      );
    }
  };

  const getOptionTitle = (option: string) => {
    const optionMap: Record<string, string> = {
      'wallet': 'TembeaPay Wallet',
      'referral': 'Réductions et cadeaux',
      'promocode': 'Codes promotionnels',
      'history': 'Historique des activités',
      'addresses': 'Mes adresses',
      'support': 'Assistance client',
      'security': 'Sécurité et vérification',
      'driver': 'Devenir conducteur',
      'team': 'Compte équipe',
      'settings': 'Paramètres'
    };
    return optionMap[option] || option;
  };

  const handleQuickAction = (action: string) => {
    console.log('🔍 [UserProfile] handleQuickAction appelé avec action:', action);
    
    if (action === 'wallet') {
      console.log('💰 [UserProfile] Action wallet détectée');
      if (onWalletAccess) {
        onWalletAccess();
      }
    } else if (action === 'tombola') {
      console.log('🎰 [UserProfile] Action tombola détectée');
      if (onClose) {
        onClose();
      }
      if (onViewChange) {
        onViewChange('tombola');
      }
    } else if (action === 'referral') {
      console.log('🎁 [UserProfile] Action referral détectée');
      if (onClose) {
        onClose();
      }
      setShowModal(false);
      navigate('/referral');
    } else {
      console.log('🔀 [UserProfile] Autre action, redirection vers handleOptionClick');
      handleOptionClick(action);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background pb-24">
      {/* Modern Profile Header with integrated nav */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <ModernProfileHeader
          profile={profile}
          user={user}
          rating={rating}
          onBack={onClose}
          onEditName={() => {
            setEditedDisplayName(profile.display_name || '');
            setIsEditingName(true);
          }}
          onEditPhone={() => {
            setEditedPhone(profile.phone_number || '');
            setIsEditingPhone(true);
          }}
        />
      </div>

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('profile.edit_name')}</h3>
            <Input
              value={editedDisplayName}
              onChange={(e) => setEditedDisplayName(e.target.value)}
              placeholder={t('profile.enter_name')}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleNameSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('profile.save')}
              </Button>
              <Button variant="outline" onClick={handleNameCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      {isEditingPhone && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('profile.edit_phone')}</h3>
            <Input
              value={editedPhone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder={t('profile.enter_phone')}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handlePhoneSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('profile.save')}
              </Button>
              <Button variant="outline" onClick={handlePhoneCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Action Buttons */}
      <div className="px-4 py-1.5">
        <ProfileActionButtons onQuickAction={handleQuickAction} />
      </div>

      {/* Feedback & Notation */}
      <AppFeedbackSection userType="client" />

      {/* Section Vendeur - Design Premium Violet */}
      <div className="px-4 py-1.5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isVendor ? (
            // Utilisateur déjà vendeur → Accès direct avec design violet
            <button
              onClick={() => navigate('/vendeur')}
              className="w-full relative overflow-hidden p-5 rounded-2xl group bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Effet glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                ACTIF
              </div>
              <div className="relative flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-lg font-bold text-white">Mon espace vendeur</div>
                  <div className="text-sm text-white/80">Gérer mes produits et commandes</div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ) : (
            // Client non-vendeur → Demander vérification
            <button
              onClick={() => handleOptionClick('vendor-request')}
              className="w-full p-5 rounded-2xl border-2 border-dashed border-violet-300/50 dark:border-violet-700/50 hover:border-violet-500 hover:bg-violet-500/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-violet-100 dark:bg-violet-900/30 p-3.5 rounded-2xl group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
                  <Store className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-lg font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Devenir vendeur</div>
                  <div className="text-sm text-muted-foreground">
                    Vendez vos produits sur TAGA Shop
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-violet-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          )}
        </motion.div>
      </div>

      {/* Profile Options List - Design Premium Glassmorphism */}
      <div className="px-4 py-1.5 space-y-2">
        {profileOptions.map((option, index) => {
          const IconComponent = option.icon;
          const gradients = {
            history: 'from-violet-500/15 to-violet-600/15',
            addresses: 'from-indigo-500/15 to-indigo-600/15',
            support: 'from-blue-500/15 to-blue-600/15',
            settings: 'from-purple-500/15 to-purple-600/15',
            logout: 'from-red-500/15 to-red-600/15'
          };
          const iconColors = {
            history: 'text-violet-500',
            addresses: 'text-indigo-500',
            support: 'text-blue-500',
            settings: 'text-purple-500',
            logout: 'text-destructive'
          };
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => option.id === 'logout' ? signOut() : handleOptionClick(option.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-violet-500/5 transition-all duration-300 rounded-2xl group bg-card/80 backdrop-blur-sm border border-border/50 hover:border-violet-300/50 dark:hover:border-violet-700/50 shadow-sm hover:shadow-md"
            >
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300 bg-gradient-to-br",
                gradients[option.id as keyof typeof gradients],
                "group-hover:scale-110"
              )}>
                <IconComponent className={cn(
                  "h-5 w-5 transition-colors",
                  iconColors[option.id as keyof typeof iconColors]
                )} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{option.title}</div>
                <div className="text-sm text-muted-foreground">{option.subtitle}</div>
              </div>
              {option.hasArrow && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 transition-all duration-300 group-hover:translate-x-1" />
              )}
            </motion.button>
          );
        })}
      </div>


      {/* Mobile-friendly Modal for detailed views */}
      <MobileProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={getOptionTitle(activeOption)}
        className="bg-card border border-border shadow-lg"
      >
        {renderModalContent()}
      </MobileProfileModal>

      <PromoCodePanel 
        open={showPromoPanel} 
        onClose={() => setShowPromoPanel(false)} 
      />
    </div>
  );
};