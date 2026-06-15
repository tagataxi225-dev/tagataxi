import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const DriverApp = lazy(() => import('@/pages/DriverApp'));
const DriverRegistration = lazy(() => import('@/pages/DriverRegistration'));
const DriverVerifyEmail = lazy(() => import('@/pages/DriverVerifyEmail'));
const DriverFindPartner = lazy(() => import('@/pages/DriverFindPartner').then(m => ({ default: m.DriverFindPartner })));
const DriverProfilEdit = lazy(() => import('@/pages/driver/DriverProfilEdit'));
const DriverProfilPhone = lazy(() => import('@/pages/driver/DriverProfilPhone'));
const DriverProfilEmail = lazy(() => import('@/pages/driver/DriverProfilEmail'));
const DriverProfilPayments = lazy(() => import('@/pages/driver/DriverProfilPayments'));
const DriverActivityHistory = lazy(() => import('@/pages/driver/DriverActivityHistory'));
const DriverProfilLanguage = lazy(() => import('@/pages/driver/DriverProfilLanguage'));
const DriverProfilTheme = lazy(() => import('@/pages/driver/DriverProfilTheme'));
const DriverProfilNotifications = lazy(() => import('@/pages/driver/DriverProfilNotifications'));
const DriverAide = lazy(() => import('@/pages/driver/DriverAide'));
const DriverConditions = lazy(() => import('@/pages/driver/DriverConditions'));

export const DriverRoutes = () => {
  return (
    <>
      <Route path="/driver/register" element={<DriverRegistration />} />
      <Route path="/driver/verify-email" element={<DriverVerifyEmail />} />
      <Route 
        path="/app/chauffeur" 
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chauffeur" 
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverApp />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/driver/find-partner"
        element={
          <ProtectedRoute>
            <DriverFindPartner />
          </ProtectedRoute>
        }
      />
      <Route path="/app/chauffeur/profil/edit" element={<ProtectedRoute requiredRole="driver"><DriverProfilEdit /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/phone" element={<ProtectedRoute requiredRole="driver"><DriverProfilPhone /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/email" element={<ProtectedRoute requiredRole="driver"><DriverProfilEmail /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/payments" element={<ProtectedRoute requiredRole="driver"><DriverProfilPayments /></ProtectedRoute>} />
      <Route path="/driver/activity-history" element={<ProtectedRoute requiredRole="driver"><DriverActivityHistory /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/langue" element={<ProtectedRoute requiredRole="driver"><DriverProfilLanguage /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/apparence" element={<ProtectedRoute requiredRole="driver"><DriverProfilTheme /></ProtectedRoute>} />
      <Route path="/app/chauffeur/profil/notifications" element={<ProtectedRoute requiredRole="driver"><DriverProfilNotifications /></ProtectedRoute>} />
      <Route path="/app/chauffeur/aide" element={<ProtectedRoute requiredRole="driver"><DriverAide /></ProtectedRoute>} />
      <Route path="/app/chauffeur/conditions" element={<ProtectedRoute requiredRole="driver"><DriverConditions /></ProtectedRoute>} />
    </>
  );
};
