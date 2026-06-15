import { lazy, Suspense } from 'react';
import { Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/** Redirige en conservant les query params (ex: ?ref=CODE) */
const RedirectWithParams = ({ to }: { to: string }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={query ? `${to}?${query}` : to} replace />;
};
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RouteLoadingFallback } from '@/components/loading/RouteLoadingFallback';

// Lazy load auth pages — they're not needed on initial landing page render
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })));
const Auth = lazy(() => import('@/pages/Auth'));
const ClientRegister = lazy(() => import('@/pages/ClientRegister'));
const DriverAuth = lazy(() => import('@/pages/DriverAuth'));
const PartnerAuth = lazy(() => import('@/pages/PartnerAuth'));
const AdminAuth = lazy(() => import('@/pages/AdminAuth'));
const RestaurantAuth = lazy(() => import('@/pages/RestaurantAuth'));
const MobileSplash = lazy(() => import('@/pages/MobileSplash'));
const Install = lazy(() => import('@/pages/Install'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

const RoleSelection = lazy(() => import('@/pages/RoleSelection'));
const EscrowPage = lazy(() => import('@/pages/EscrowPage').then(m => ({ default: m.EscrowPage })));
const UserVerification = lazy(() => import('@/components/profile/UserVerification').then(m => ({ default: m.UserVerification })));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const CampaignLanding = lazy(() => import('@/pages/campaign/CampaignLanding'));
const CampaignThankYou = lazy(() => import('@/pages/campaign/CampaignThankYou'));
const RestaurantApp = lazy(() => import('@/pages/RestaurantApp'));
const RestaurantVerifyEmail = lazy(() => import('@/pages/RestaurantVerifyEmail'));
const RestaurantMenuManager = lazy(() => import('@/pages/restaurant/RestaurantMenuManager'));
const RestaurantOrders = lazy(() => import('@/pages/restaurant/RestaurantOrders'));
const RestaurantSubscription = lazy(() => import('@/pages/restaurant/RestaurantSubscription'));
const RestaurantPOS = lazy(() => import('@/pages/restaurant/RestaurantPOS'));
const RestaurantProfile = lazy(() => import('@/pages/restaurant/RestaurantProfile'));
const RestaurantWalletPage = lazy(() => import('@/pages/restaurant/RestaurantWalletPage'));
const RestaurantEscrowPage = lazy(() => import('@/pages/restaurant/RestaurantEscrowPage'));
const TestSoundsPage = lazy(() => import('@/pages/TestSoundsPage').then(m => ({ default: m.TestSoundsPage })));
const TestLotteryPage = lazy(() => import('@/pages/TestLotteryPage').then(m => ({ default: m.TestLotteryPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const FoodTracking = lazy(() => import('@/pages/food/FoodTracking'));

export const SharedRoutes = () => {
  return (
    <>
      {/* 🛡️ Auth routes — ProtectedRoute requireAuth={false} redirige les users connectés */}
      <Route path="/app/auth" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={
        <ProtectedRoute requireAuth={false}>
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full"
          >
            <Auth />
          </motion.div>
        </ProtectedRoute>
      } />
      <Route path="/app/register" element={
        <ProtectedRoute requireAuth={false}>
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full"
          >
            <ClientRegister />
          </motion.div>
        </ProtectedRoute>
      } />
      
      {/* Redirects pour anciens liens de parrainage */}
      <Route path="/signup" element={<RedirectWithParams to="/app/register" />} />
      <Route path="/register" element={<RedirectWithParams to="/app/register" />} />
      <Route path="/client/register" element={<RedirectWithParams to="/app/register" />} />
      
      {/* 🛡️ Routes auth par rôle — protégées contre accès utilisateur connecté */}
      <Route path="/driver/auth" element={
        <ProtectedRoute requireAuth={false}>
          <DriverAuth />
        </ProtectedRoute>
      } />
      <Route path="/partner/auth" element={
        <ProtectedRoute requireAuth={false}>
          <PartnerAuth />
        </ProtectedRoute>
      } />
      <Route path="/operatorx/admin/auth" element={
        <ProtectedRoute requireAuth={false}>
          <AdminAuth />
        </ProtectedRoute>
      } />
      <Route path="/restaurant/auth" element={
        <ProtectedRoute requireAuth={false}>
          <RestaurantAuth />
        </ProtectedRoute>
      } />
      
      {/* Email verification */}
      <Route path="/client/verify-email" element={<EmailVerificationPage type="client" />} />
      <Route path="/driver/verify-email" element={<EmailVerificationPage type="driver" />} />
      <Route path="/partner/verify-email" element={<EmailVerificationPage type="partner" />} />
      <Route path="/restaurant/verify-email" element={<EmailVerificationPage type="restaurant" />} />
      
      {/* Restaurant routes */}
      <Route path="/app/restaurant" element={<ProtectedRoute><RestaurantApp /></ProtectedRoute>} />
      <Route path="/restaurant" element={<ProtectedRoute><RestaurantApp /></ProtectedRoute>} />
      <Route path="/restaurant/menu" element={<ProtectedRoute><RestaurantMenuManager /></ProtectedRoute>} />
      <Route path="/restaurant/orders" element={<ProtectedRoute><RestaurantOrders /></ProtectedRoute>} />
      <Route path="/restaurant/subscription" element={<ProtectedRoute><RestaurantSubscription /></ProtectedRoute>} />
      <Route path="/restaurant/pos" element={<ProtectedRoute><RestaurantPOS /></ProtectedRoute>} />
      <Route path="/restaurant/profile" element={<ProtectedRoute><RestaurantProfile /></ProtectedRoute>} />
      <Route path="/restaurant/wallet" element={<ProtectedRoute><RestaurantWalletPage /></ProtectedRoute>} />
      <Route path="/restaurant/escrow" element={<ProtectedRoute><RestaurantEscrowPage /></ProtectedRoute>} />
      
      {/* Common protected routes */}
      <Route path="/role-selection" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
      <Route path="/escrow" element={<ProtectedRoute><EscrowPage /></ProtectedRoute>} />
      <Route 
        path="/verification/identity" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <UserVerification />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      
      {/* Misc */}
      <Route path="/splash" element={<MobileSplash />} />
      <Route path="/install" element={<Install />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route 
        path="/onboarding" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <Onboarding />
          </Suspense>
        } 
      />
      <Route path="/campaign/:campaignId" element={<CampaignLanding />} />
      <Route path="/campaign-thank-you" element={<CampaignThankYou />} />
      
      {/* Dev/Test routes */}
      <Route path="/test-sounds" element={<TestSoundsPage />} />
      <Route path="/test-lottery" element={<TestLotteryPage />} />
      
      {/* Notifications page */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      
      {/* Food tracking route */}
      <Route 
        path="/unified-tracking/food/:orderId" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <FoodTracking />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      <Route path="/admin/marketplace" element={<Navigate to="/operatorx/admin?tab=marketplace-management" replace />} />
    </>
  );
};
