import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useLocation } from 'react-router-dom';
import { useTabScrollReset } from '@/hooks/useTabScrollReset';
import { ModernPartnerHeader } from '@/components/partner/navigation/ModernPartnerHeader';
import { UniversalBottomNavigation, UniversalTabType } from '@/components/navigation/UniversalBottomNavigation';
import { PartnerAnalyticsDashboard } from '@/components/partner/PartnerAnalyticsDashboard';
import { PartnerProfilePage } from '@/components/partner/PartnerProfilePage';
import { JobsManagerDashboard } from '@/components/job/publisher';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { usePartnerType } from '@/hooks/usePartnerType';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Package, Car, ChevronRight } from 'lucide-react';
import { getPartnerAccess } from '@/components/guards/PartnerGuard';
import { TEAM_ROLE_PERMISSIONS, TeamRole } from '@/hooks/usePartnerTeamManagement';

// Delivery imports
import { PartnerDeliveryDashboard } from '@/components/partner/delivery/PartnerDeliveryDashboard';
import { DeliveryDriversHub } from '@/components/partner/delivery/DeliveryDriversHub';

// Auto imports
import { PartnerAutoDashboard } from '@/components/partner/auto/PartnerAutoDashboard';
import { AutoDriversHub } from '@/components/partner/auto/AutoDriversHub';
import PartnerRentalManager from '@/components/partner/rental/PartnerRentalManager';

// Desktop navs
import { PartnerDeliveryDesktopNav } from '@/components/partner/navigation/PartnerDeliveryDesktopNav';
import { PartnerAutoDesktopNav } from '@/components/partner/navigation/PartnerAutoDesktopNav';

type DeliveryTab = 'dashboard' | 'drivers' | 'analytics' | 'settings';
type AutoTab = 'dashboard' | 'drivers' | 'fleet' | 'analytics' | 'settings';
type PartnerTab = DeliveryTab | AutoTab;

// ─── Type Selector ───────────────────────────────────────────────
const PartnerTypeSelector = ({ onSelect }: { onSelect: (t: 'delivery' | 'auto') => void }) => (
  <div className="min-h-dvh bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Configurez votre espace</h1>
        <p className="text-muted-foreground text-sm">Choisissez votre type de partenariat pour personnaliser l'interface</p>
      </div>
      <div className="grid gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('delivery')}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-orange-400 bg-card hover:bg-orange-50/40 dark:hover:bg-orange-950/20 transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">Partenaire Delivery</p>
            <p className="text-sm text-muted-foreground">Moto Flash · Camionnette Flex · Camion MaxiCharge</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('auto')}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-blue-400 bg-card hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md shrink-0">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">Partenaire Auto</p>
            <p className="text-sm text-muted-foreground">Taxi · VTC · Location de véhicules</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
        </motion.button>
      </div>
    </div>
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
const PartnerApp = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { partnerType, loading: typeLoading, updatePartnerType } = usePartnerType();

  const partnerAccess = getPartnerAccess();
  const isTeamMember = partnerAccess?.isTeamMember ?? false;
  const teamRole = (partnerAccess?.teamRole as TeamRole) || 'admin';
  const permissions = isTeamMember ? TEAM_ROLE_PERMISSIONS[teamRole] : TEAM_ROLE_PERMISSIONS.admin;

  const getDefaultTab = (): PartnerTab => {
    if (location.pathname.includes('/partner/profile') || location.pathname.includes('/partner/settings')) {
      return permissions.settings ? 'settings' : 'dashboard';
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<PartnerTab>(getDefaultTab());
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { stats } = usePartnerStats();
  const { unreadCount } = useSystemNotifications();

  useTabScrollReset(activeTab, { behavior: 'smooth', delay: 50 });

  // Tab guard: si le membre n'a pas accès à l'onglet sélectionné, fallback
  useEffect(() => {
    const tabKey = activeTab as keyof typeof permissions;
    if (tabKey in permissions && !permissions[tabKey]) {
      setActiveTab('dashboard');
    }
  }, [activeTab, permissions]);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!user) return;
      try {
        // Si membre d'équipe, charger le profil du propriétaire
        const targetUserId = partnerAccess?.partnerUserId || user.id;

        const { data, error } = await supabase
          .from('partenaires')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
        if (error) throw error;
        setPartnerProfile(data);
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchPartnerProfile();
  }, [user, partnerAccess]);

  const handleTypeSelect = async (type: 'delivery' | 'auto') => {
    await updatePartnerType(type);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab: PartnerTab) => {
    const tabKey = tab as keyof typeof permissions;
    if (tabKey in permissions && !permissions[tabKey]) {
      return; // Bloquer l'accès
    }
    setActiveTab(tab);
  };

  if (profileLoading || typeLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partnerType) {
    return <PartnerTypeSelector onSelect={handleTypeSelect} />;
  }

  const fadeVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
  };

  // ── DELIVERY CONTENT ──
  const renderDeliveryContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div key="dashboard" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <PartnerDeliveryDashboard onViewChange={(v) => handleTabChange(v as PartnerTab)} partnerProfile={partnerProfile} />
          </motion.div>
        );
      case 'drivers':
        return permissions.drivers ? (
          <motion.div key="drivers" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Livreurs</h2>
              <p className="text-sm text-muted-foreground">Flash · Flex · MaxiCharge</p>
            </div>
            <DeliveryDriversHub />
          </motion.div>
        ) : null;
      case 'analytics':
        return permissions.analytics ? (
          <motion.div key="analytics" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Analytics</h2>
              <p className="text-sm text-muted-foreground">Performances de votre activité delivery</p>
            </div>
            <PartnerAnalyticsDashboard />
          </motion.div>
        ) : null;
      case 'settings':
        return permissions.settings ? (
          <motion.div key="settings" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <PartnerProfilePage />
          </motion.div>
        ) : null;
      default:
        return null;
    }
  };

  // ── AUTO CONTENT ──
  const renderAutoContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div key="dashboard" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <PartnerAutoDashboard onViewChange={(v) => handleTabChange(v as PartnerTab)} partnerProfile={partnerProfile} />
          </motion.div>
        );
      case 'drivers':
        return permissions.drivers ? (
          <motion.div key="drivers" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Chauffeurs & Véhicules</h2>
              <p className="text-sm text-muted-foreground">Taxi · VTC · Flotte</p>
            </div>
            <AutoDriversHub />
          </motion.div>
        ) : null;
      case 'fleet':
        return permissions.fleet ? (
          <motion.div key="fleet" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Location de véhicules</h2>
              <p className="text-sm text-muted-foreground">Gestion des réservations et abonnements</p>
            </div>
            <PartnerRentalManager />
          </motion.div>
        ) : null;
      case 'analytics':
        return permissions.analytics ? (
          <motion.div key="analytics" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Analytics</h2>
              <p className="text-sm text-muted-foreground">Performances de votre flotte</p>
            </div>
            <PartnerAnalyticsDashboard />
          </motion.div>
        ) : null;
      case 'settings':
        return permissions.settings ? (
          <motion.div key="settings" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="px-4 pt-2 pb-6">
            <PartnerProfilePage />
          </motion.div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Team member banner */}
      {isTeamMember && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-center text-sm text-blue-700 dark:text-blue-300">
          Vous accédez en tant que <strong>{teamRole === 'admin' ? 'Administrateur' : teamRole === 'manager' ? 'Gestionnaire' : teamRole === 'accountant' ? 'Comptable' : 'Observateur'}</strong> de l'équipe
        </div>
      )}

      {/* Header */}
      <ModernPartnerHeader
        partnerName={partnerProfile?.contact_name || 'Partenaire'}
        companyName={partnerProfile?.company_name}
        notificationCount={unreadCount}
        partnerType={partnerType}
        partnerLogoUrl={partnerProfile?.logo_url}
      />

      {/* Desktop Navigation */}
      {!isMobile && partnerType === 'delivery' && (
        <PartnerDeliveryDesktopNav
          activeTab={activeTab as DeliveryTab}
          onTabChange={(tab) => handleTabChange(tab)}
        />
      )}
      {!isMobile && partnerType === 'auto' && (
        <PartnerAutoDesktopNav
          activeTab={activeTab as AutoTab}
          onTabChange={(tab) => handleTabChange(tab)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-2 pb-[var(--bottom-nav-height-safe,96px)]">
        <AnimatePresence mode="wait">
          {partnerType === 'delivery' ? renderDeliveryContent() : renderAutoContent()}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <UniversalBottomNavigation
          userType={partnerType === 'delivery' ? 'partner_delivery' : 'partner_auto'}
          activeTab={activeTab as UniversalTabType}
          onTabChange={(tab) => handleTabChange(tab as PartnerTab)}
          showLabels={true}
        />
      )}
    </div>
  );
};

export default PartnerApp;
