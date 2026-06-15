import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverShell from '@/components/driver/DriverShell';
import { GainsTab, ChallengesTab, SubscriptionTab } from '@/components/driver/DriverTabs';
import { SimplifiedDriverDashboard } from '@/components/driver/SimplifiedDriverDashboard';
import { ServiceMigrationModal } from '@/components/onboarding/ServiceMigrationModal';
import { ServiceTypeValidator } from '@/components/driver/ServiceTypeValidator';
import { WithdrawModal } from '@/components/driver/wallet/WithdrawModal';
import { TopUpModal } from '@/components/driver/wallet/TopUpModal';
import { DriverServiceProvider } from '@/contexts/DriverServiceContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useDriverServiceInfo } from '@/hooks/useDriverServiceInfo';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useDriverWallet } from '@/hooks/useDriverWallet';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { useDriverRegistrationResume } from '@/hooks/useDriverRegistrationResume';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';

type Tab = 'home' | 'gains' | 'challenges' | 'subscription' | 'profile';
type ServiceMode = 'taxi' | 'delivery';

// Maps wallet transaction_type → GainsTab Transaction type
const mapTxType = (t: string): 'ride_earning' | 'delivery_earning' | 'recharge' | 'withdrawal' | 'commission' | 'bonus' => {
  if (t === 'ride_earning' || t === 'delivery_earning' || t === 'recharge' || t === 'withdrawal' || t === 'commission' || t === 'bonus') {
    return t as any;
  }
  if (t === 'commission_deduction') return 'commission';
  if (t === 'credit') return 'ride_earning';
  if (t === 'debit') return 'withdrawal';
  if (t === 'bonus' || t === 'reward') return 'bonus';
  return 'ride_earning';
};

// Parses features field (JSON array or object) from subscription_plans → string[]
const parseFeatures = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (raw && typeof raw === 'object') return Object.values(raw).map(String);
  return [];
};

const DriverApp = () => {
  const { loading: serviceLoading, serviceType: rawServiceType, serviceSpecialization } = useDriverServiceInfo();
  // Default 'unknown' drivers to taxi so the dashboard renders instead of a blank screen.
  // The migration modal still surfaces below via rawServiceType to prompt the driver to confirm.
  const serviceType = rawServiceType === 'unknown' ? 'taxi' : rawServiceType;
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('partner_drivers')
      .select('id')
      .eq('driver_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => setHasPartner(!!data));
  }, [user]);

  useSystemNotifications();
  useDriverNotifications();
  useDriverRegistrationResume();

  const { activeOrders, pendingNotifications } = useDriverDispatch();
  const { stats } = useDriverEarnings();
  const {
    balance,
    bonusBalance,
    ecoCredits,
    kwendaPoints,
    transactions,
    weeklyEarnings,
    currency: walletCurrency,
    refetch: refetchWallet,
  } = useDriverWallet();

  const serviceMode: ServiceMode = serviceType === 'delivery' ? 'delivery' : 'taxi';
  const { plans: dbPlans, currentSubscription, subscribeToplan } = useDriverSubscriptions();

  // Clear login-in-progress flags now that we've reached the driver app
  useEffect(() => {
    localStorage.removeItem('kwenda_login_in_progress');
    localStorage.removeItem('kwenda_login_time');
  }, []);

  // Redirect non-drivers
  useEffect(() => {
    if (!roleLoading && user && primaryRole !== null && primaryRole !== 'driver') {
      navigate('/driver/auth', { replace: true });
    }
  }, [user, primaryRole, roleLoading, navigate]);

  // Show migration modal when service type unknown
  useEffect(() => {
    if (!serviceLoading && rawServiceType === 'unknown' && user) {
      setShowMigrationModal(true);
    }
  }, [serviceLoading, rawServiceType, user]);

  const relevantActiveOrders = useMemo(() =>
    activeOrders.filter(o =>
      serviceMode === 'taxi'
        ? o.type === 'taxi'
        : o.type === 'delivery' || o.type === 'marketplace'
    ), [activeOrders, serviceMode]);

  const relevantPending = useMemo(() =>
    pendingNotifications.filter(n =>
      serviceMode === 'taxi'
        ? n.type === 'taxi'
        : n.type === 'delivery' || n.type === 'marketplace'
    ), [pendingNotifications, serviceMode]);

  // Keep hasActiveRide true during bidding→active transition to prevent footer flash
  const [transitioningToActive, setTransitioningToActive] = React.useState(false);
  React.useEffect(() => {
    const h = () => { setTransitioningToActive(true); setTimeout(() => setTransitioningToActive(false), 3000); };
    window.addEventListener('ride-accepted', h);
    return () => window.removeEventListener('ride-accepted', h);
  }, []);
  // Include bidding notifications in hasActiveRide to hide footer during popup
  const [hasBiddingPopup, setHasBiddingPopup] = React.useState(false);
  React.useEffect(() => {
    const show = () => setHasBiddingPopup(true);
    const hide = () => setHasBiddingPopup(false);
    window.addEventListener('bidding-popup-open', show);
    window.addEventListener('bidding-popup-close', hide);
    window.addEventListener('ride-accepted', hide);
    return () => {
      window.removeEventListener('bidding-popup-open', show);
      window.removeEventListener('bidding-popup-close', hide);
      window.removeEventListener('ride-accepted', hide);
    };
  }, []);
  const hasActiveRide = relevantActiveOrders.length > 0 || relevantPending.length > 0 || transitioningToActive || hasBiddingPopup;

  const currency = walletCurrency || 'CDF';
  const LOW_BALANCE_THRESHOLD = currency === 'XOF' ? 500 : 1000;
  const isLowBalance = (balance + bonusBalance) < LOW_BALANCE_THRESHOLD;

  const gainsTransactions = useMemo(() =>
    transactions.map(t => ({
      id: t.id,
      type: mapTxType(t.transaction_type),
      label: t.description || 'Transaction',
      amount: t.amount,
      date: t.created_at,
      status: (t.status === 'completed' || t.status === 'pending' || t.status === 'failed')
        ? t.status as 'completed' | 'pending' | 'failed'
        : 'completed' as const,
    }))
  , [transactions]);

  // Map subscription_plans rows → SubscriptionTab Plan shape
  const plans = useMemo(() => {
    const count = dbPlans.length;
    return dbPlans.map((p, i) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rides: p.rides_included ?? 0,
      commission: p.commission_rate ?? 12,
      features: parseFeatures(p.features),
      popular: count > 1 && i === Math.floor((count - 1) / 2),
      premium: i === count - 1,
      isActive: p.id === currentSubscription?.plan_id,
    }));
  }, [dbPlans, currentSubscription?.plan_id]);

  // Active plan from driver_subscriptions joined with subscription_plans
  const activePlan = currentSubscription?.subscription_plans ? {
    name: currentSubscription.subscription_plans.name,
    expiresAt: currentSubscription.end_date,
    ridesRemaining: currentSubscription.rides_remaining ?? 0,
    ridesTotal: currentSubscription.subscription_plans.rides_included ?? 30,
  } : undefined;

  if (!roleLoading && user && primaryRole === null) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl" aria-hidden="true">⏳</span>
        <h2 className="text-xl font-bold">Compte en attente de validation</h2>
        <p className="text-gray-500 text-sm">Vous serez notifié par email.</p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut().then(() => navigate('/driver/auth'))}
          className="text-red-600 text-sm mt-4"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (hasPartner === null) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (hasPartner === false) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-black">Rejoignez une flotte</h2>
        <p className="text-gray-500 text-sm">
          Associez-vous à un partenaire pour recevoir des courses.
        </p>
        <button
          type="button"
          onClick={() => navigate('/driver/find-partner')}
          className="w-full h-14 bg-red-600 text-white rounded-2xl font-bold"
        >
          Rejoindre une flotte →
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut().then(() => navigate('/driver/auth'))}
          className="text-gray-400 text-sm mt-2"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (serviceLoading || roleLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DriverServiceProvider>
      <ServiceTypeValidator serviceType={serviceType} serviceSpecialization={serviceSpecialization} />

      <ServiceMigrationModal
        open={showMigrationModal}
        onComplete={() => { setShowMigrationModal(false); window.location.reload(); }}
      />

      <WithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        currentBalance={balance}
        onSuccess={refetchWallet}
      />

      <TopUpModal
        open={showTopUpModal}
        onOpenChange={setShowTopUpModal}
        onSuccess={refetchWallet}
      />

      <DriverShell
        hasActiveRide={hasActiveRide}
        activeTab={activeTab}
        currency={currency}
        onTabChange={setActiveTab}
        gainsSlot={
          <GainsTab
            walletBalance={balance}
            bonusBalance={bonusBalance}
            ecoCredits={ecoCredits}
            kwendaPoints={kwendaPoints}
            currency={currency}
            weeklyEarnings={weeklyEarnings}
            weeklyChange={stats.weeklyProgress}
            transactions={gainsTransactions}
            onWithdraw={() => setShowWithdrawModal(true)}
            onRecharge={() => setShowTopUpModal(true)}
            lowBalance={isLowBalance}
            lowBalanceThreshold={LOW_BALANCE_THRESHOLD}
          />
        }
        challengesSlot={
          <ChallengesTab
            activeChallenges={[]}
            completedChallenges={[]}
            currency={currency}
          />
        }
        subscriptionSlot={
          <SubscriptionTab
            activePlan={activePlan}
            plans={plans}
            currency={currency}
            walletBalance={balance}
            onSelectPlan={(planId) => {
              const plan = plans.find(p => p.id === planId);
              subscribeToplan(planId, plan && plan.price === 0 ? 'free' : 'wallet', balance);
            }}
          />
        }
      />

      {/* DriverScreen: always shown on home tab; overlays other tabs when ride is active */}
      {(hasActiveRide || activeTab === 'home') && (
        <SimplifiedDriverDashboard serviceType={serviceMode} onRideComplete={refetchWallet} />
      )}
    </DriverServiceProvider>
  );
};

export default DriverApp;
