import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendorStats } from '@/hooks/useVendorStats';
import { 
  Store, Settings, TrendingUp, 
  LogOut, Users, Package, DollarSign, BarChart3,
  ShoppingBag, Bell, Shield, Share2, Edit2, ChevronRight, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VendorSettings } from './VendorSettings';
import { VendorSalesHistory } from './VendorSalesHistory';
import { VendorEscrowManager } from './VendorEscrowManager';
import { VendorAnalytics } from './VendorAnalytics';
import { VendorFollowers } from './VendorFollowers';
import { VendorShopSettings } from '@/components/marketplace/VendorShopSettings';
import { VendorTeamManager } from './VendorTeamManager';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VendorProfilePageProps {
  onTabChange?: (tab: string) => void;
}

export const VendorProfilePage = ({ onTabChange }: VendorProfilePageProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats } = useVendorStats();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [escrowOpen, setEscrowOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [shopSettingsOpen, setShopSettingsOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile-full', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Déconnexion réussie" });
    } catch (error) {
      toast({ title: "Erreur lors de la déconnexion", variant: "destructive" });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/marketplace/vendor/${vendor?.user_id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié", description: "Le lien de votre boutique a été copié" });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuSections = [
    {
      title: "Ma Boutique",
      items: [
        { icon: Store, label: "Infos boutique", onClick: () => setShopSettingsOpen(true) },
        { icon: Package, label: "Mes produits", onClick: () => onTabChange?.('shop') },
        { icon: ShoppingBag, label: "Mes commandes", onClick: () => onTabChange?.('orders') },
      ]
    },
    {
      title: "Finances",
      items: [
        { icon: DollarSign, label: "Historique ventes", onClick: () => setSalesHistoryOpen(true) },
        { icon: TrendingUp, label: "Compte séquestre", onClick: () => setEscrowOpen(true) },
        { icon: BarChart3, label: "Analytics", onClick: () => setAnalyticsOpen(true) },
      ]
    },
    {
      title: "Compte",
      items: [
        { icon: Users, label: "Mon équipe", onClick: () => setTeamOpen(true) },
        { icon: Settings, label: "Paramètres", onClick: () => setSettingsOpen(true) },
        { icon: Bell, label: "Notifications", onClick: () => setSettingsOpen(true) },
        { icon: Users, label: "Mes clients", onClick: () => setFollowersOpen(true) },
        { icon: Shield, label: "Aide & Support", onClick: () => navigate('/support/help-center') },
      ]
    }
  ];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">

      {/* ── Header compact ── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/40 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar with logo + camera overlay */}
          <div className="relative group shrink-0">
            <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-primary/40 shadow-md">
              <Avatar className="h-16 w-16 border-2 border-background">
                {(vendor as any)?.shop_logo_url ? (
                  <AvatarImage 
                    src={`${(vendor as any).shop_logo_url}${(vendor as any).shop_logo_url.includes('?') ? '&' : '?'}v=${vendor?.updated_at || ''}`}
                    alt={vendor?.shop_name || 'Boutique'} 
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {getInitials(vendor?.shop_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={() => setShopSettingsOpen(true)}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-opacity duration-200"
              aria-label="Modifier le logo"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold truncate">{vendor?.shop_name || 'Ma Boutique'}</h1>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-primary/10 text-primary border-0 shrink-0 gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
                Actif
              </Badge>
              {(vendor as any)?.shop_type === 'supermarket' && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-accent text-accent-foreground border-0 shrink-0">
                  🛒 Supermarché
                </Badge>
              )}
            </div>
            {vendor?.shop_description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{vendor.shop_description}</p>
            )}
            {vendor?.created_at && (
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Membre depuis {format(new Date(vendor.created_at), 'MMMM yyyy', { locale: fr })}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mt-4">
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Partager
          </Button>
          <Button size="sm" className="flex-1 h-9 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all" onClick={() => setShopSettingsOpen(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Modifier
          </Button>
        </div>
      </div>

      {/* ── Stats inline ── */}
      <div className="rounded-xl bg-muted/30 border border-border/40 flex divide-x divide-border/40">
        <div className="flex-1 py-3 px-2 text-center">
          <p className="text-lg font-semibold">{stats?.activeProducts ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Produits</p>
        </div>
        <div className="flex-1 py-3 px-2 text-center">
          <p className="text-lg font-semibold">{stats?.totalOrders ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Commandes</p>
        </div>
        <div className="flex-1 py-3 px-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <p className="text-lg font-semibold">{vendor?.average_rating?.toFixed(1) || '0.0'}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Note</p>
        </div>
      </div>

      {/* ── Menu sections ── */}
      <div className="space-y-4">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {section.title}
            </p>
            <div className="rounded-xl bg-card border border-border/60 divide-y divide-border/40">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Déconnexion ── */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>

      {/* ── Liens légaux ── */}
      <LegalFooterLinks />

      {/* ── Dialogs ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorSettings />
        </DialogContent>
      </Dialog>

      <Dialog open={salesHistoryOpen} onOpenChange={setSalesHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <VendorSalesHistory />
        </DialogContent>
      </Dialog>

      <Dialog open={escrowOpen} onOpenChange={setEscrowOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorEscrowManager />
        </DialogContent>
      </Dialog>

      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <VendorAnalytics />
        </DialogContent>
      </Dialog>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorFollowers />
        </DialogContent>
      </Dialog>

      <Dialog open={shopSettingsOpen} onOpenChange={setShopSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <VendorShopSettings />
        </DialogContent>
      </Dialog>

      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogContent className="w-full h-full max-w-none rounded-none sm:rounded-lg sm:max-w-2xl sm:h-auto sm:max-h-[80vh] overflow-y-auto">
          <VendorTeamManager />
        </DialogContent>
      </Dialog>
    </div>
  );
};
