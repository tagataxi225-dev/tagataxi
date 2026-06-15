import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PartnerGuard } from '@/components/guards/PartnerGuard';

const PartnerApp = lazy(() => import('@/pages/PartnerApp'));
const PartnerAuth = lazy(() => import('@/pages/PartnerAuth'));
const ModernRegistrationWizard = lazy(() => import('@/components/partner/registration/ModernRegistrationWizard'));
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard'));
const PartnerRentalSubscriptionManagement = lazy(() => import('@/pages/partner/PartnerRentalSubscriptionManagement'));
const PartnerPendingApproval = lazy(() => import('@/pages/partner/PartnerPendingApproval'));

// Wrapper pour passer defaultTab à PartnerApp
const PartnerProfileWrapper = () => {
  const PartnerAppComponent = lazy(() => import('@/pages/PartnerApp'));
  return <PartnerAppComponent />;
};

export const PartnerRoutes = () => {
  return (
    <>
      <Route 
        path="/app/partenaire" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partenaire" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route path="/partner/register" element={<ModernRegistrationWizard />} />
      <Route 
        path="/partner/pending-approval" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerPendingApproval />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partner/dashboard" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerDashboard />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partner/rental/subscription" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerRentalSubscriptionManagement />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      {/* Routes profil et settings qui redirigent vers PartnerApp avec le bon onglet */}
      <Route 
        path="/partner/profile" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partner/settings" 
        element={
          <ProtectedRoute requiredRole="partner">
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
    </>
  );
};
