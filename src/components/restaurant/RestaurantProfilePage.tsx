import { useState, useEffect } from 'react';
import { AppFeedbackSection } from '@/components/shared/AppFeedbackSection';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  LogOut, Settings, ChefHat, ShoppingBag, Wallet, 
  HelpCircle, ChevronRight, Phone, Mail, MapPin,
  TrendingUp, FileText, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from '@/hooks/use-toast';
import { RestaurantProfileHeader } from './RestaurantProfileHeader';
import { RestaurantStats } from './RestaurantStats';
import { RestaurantSettings } from './RestaurantSettings';
import { RestaurantSubscriptionBanner } from './RestaurantSubscriptionBanner';
import { RestaurantTeamManager } from './RestaurantTeamManager';
import { useAuth } from '@/hooks/useAuth';

interface ProfileDetails {
  phone_number: string;
  email: string;
  city: string;
  address: string;
}

export function RestaurantProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileDetails();
    }
  }, [user]);

  const loadProfileDetails = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('restaurant_profiles')
        .select('phone_number, email, city, address')
        .eq('user_id', user.id)
        .single();
      if (data) setProfileDetails(data);
    } catch (error) {
      console.error('Error loading profile details:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    { 
      icon: ChefHat, 
      label: 'Mon menu', 
      description: 'Gérer mes plats',
      onClick: () => navigate('/restaurant?tab=menu')
    },
    { 
      icon: ShoppingBag, 
      label: 'Mes commandes', 
      description: 'Voir les commandes',
      onClick: () => navigate('/restaurant?tab=orders')
    },
    { 
      icon: Wallet, 
      label: 'Mon portefeuille', 
      description: 'Finances & paiements',
      onClick: () => navigate('/restaurant?tab=wallet')
    },
    { 
      icon: TrendingUp, 
      label: 'Statistiques', 
      description: 'Performances détaillées',
      onClick: () => navigate('/restaurant?tab=analytics')
    },
    { 
      icon: Users, 
      label: 'Mon équipe', 
      description: 'Gérer les collaborateurs',
      onClick: () => setShowTeam(true)
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      description: 'Images & configuration',
      onClick: () => setShowSettings(true)
    },
    { 
      icon: HelpCircle, 
      label: 'Aide', 
      description: 'Centre de support',
      onClick: () => navigate('/help')
    },
    { 
      icon: FileText, 
      label: 'Conditions', 
      description: 'Mentions légales',
      onClick: () => navigate('/terms')
    },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      {/* En-tête profil centré */}
      <RestaurantProfileHeader />
      
      {/* Stats compactes */}
      <div className="px-4">
        <RestaurantStats />
      </div>

      {/* Banner abonnement */}
      <div className="px-4">
        <RestaurantSubscriptionBanner isSubscribed={false} />
      </div>

      {/* Menu navigation épuré */}
      <Card className="mx-4 border-0 shadow-sm">
        <CardContent className="p-2">
          <div className="space-y-0.5">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Détails du restaurant (dépliable) */}
      {profileDetails && (
        <div className="px-4">
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-muted-foreground">
                Informations détaillées
              </span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${detailsOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3 p-4 rounded-xl bg-muted/20">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profileDetails.phone_number}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{profileDetails.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profileDetails.address || profileDetails.city}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Feedback & Notation */}
      <AppFeedbackSection userType="restaurant" />

      {/* Bouton de déconnexion */}
      <div className="px-4 pt-4">
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </div>

      {/* Dialog Équipe */}
      <Dialog open={showTeam} onOpenChange={setShowTeam}>
        <DialogContent className="w-full h-full max-w-none rounded-none sm:rounded-lg sm:max-w-2xl sm:h-auto sm:max-h-[80vh] overflow-y-auto">
          <RestaurantTeamManager />
        </DialogContent>
      </Dialog>

      {/* Dialog Paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <RestaurantSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}
