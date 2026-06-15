import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveVendorLayout } from '@/components/vendor/ResponsiveVendorLayout';
import { ChatVendorModal } from '@/components/vendor/modern/ChatVendorModal';
import { VendorNotificationCenter } from '@/components/vendor/modern/VendorNotificationCenter';
import { VendorDashboardOverview } from '@/components/vendor/VendorDashboardOverview';
import { VendorProductManager } from '@/components/vendor/VendorProductManager';
import { VendorOrdersList } from '@/components/vendor/VendorOrdersList';
import { VendorProfilePage } from '@/components/vendor/VendorProfilePage';
import { VendorSubscriptionManager } from '@/components/vendor/VendorSubscriptionManager';
import { VendorFinancesDashboard } from '@/components/vendor/VendorFinancesDashboard';
import { useVendorStats } from '@/hooks/useVendorStats';
import { useVendorChat } from '@/hooks/useVendorChat';
import { useTabScrollReset } from '@/hooks/useTabScrollReset';

export default function ModernVendorDashboard() {
  const { user } = useAuth();
  const { stats } = useVendorStats();
  const { totalUnread } = useVendorChat();

  const { data: vendorProfile } = useQuery({
    queryKey: ['vendor-shop-name', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('vendor_profiles')
        .select('shop_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Scroll automatique vers le haut quand on change d'onglet
  useTabScrollReset(activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <VendorDashboardOverview onTabChange={setActiveTab} />;
      case 'shop':
        return <VendorProductManager onTabChange={setActiveTab} />;
      case 'orders':
        return <VendorOrdersList />;
      case 'finances':
        return <VendorFinancesDashboard />;
      case 'profile':
        return <VendorProfilePage onTabChange={setActiveTab} />;
      case 'subscription':
        return <VendorSubscriptionManager />;
      default:
        return <VendorDashboardOverview onTabChange={setActiveTab} />;
    }
  };

  return (
    <ResponsiveVendorLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      stats={stats}
      onOpenChat={() => setChatModalOpen(true)}
      onOpenNotifications={() => setNotifCenterOpen(true)}
      unreadChatCount={totalUnread}
      shopName={vendorProfile?.shop_name || undefined}
    >
      {/* Contenu dynamique avec AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Modales */}
      <ChatVendorModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <VendorNotificationCenter open={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />
    </ResponsiveVendorLayout>
  );
}
