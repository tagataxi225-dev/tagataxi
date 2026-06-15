import { lazy } from 'react';
import { Route } from 'react-router-dom';


// Pages publiques
const HelpCenter = lazy(() => import('@/pages/support/HelpCenter'));
const Contact = lazy(() => import('@/pages/support/Contact'));
const FAQ = lazy(() => import('@/pages/support/FAQ'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));
const Cookies = lazy(() => import('@/pages/legal/Cookies'));
const LegalNotice = lazy(() => import('@/pages/legal/LegalNotice'));
const Kinshasa = lazy(() => import('@/pages/locations/Kinshasa'));
const Lubumbashi = lazy(() => import('@/pages/locations/Lubumbashi'));
const Kolwezi = lazy(() => import('@/pages/locations/Kolwezi'));
const About = lazy(() => import('@/pages/about/About'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const DebugUpdate = lazy(() => import('@/pages/DebugUpdate'));
const TransportVTC = lazy(() => import('@/pages/services/TransportVTC'));
const LivraisonExpress = lazy(() => import('@/pages/services/LivraisonExpress'));
const LocationVehicules = lazy(() => import('@/pages/services/LocationVehicules'));
const DevenirChauffeur = lazy(() => import('@/pages/partners/DevenirChauffeur'));
const LouerVehicule = lazy(() => import('@/pages/partners/LouerVehicule'));
const DevenirLivreur = lazy(() => import('@/pages/partners/DevenirLivreur'));
const VendreEnLigne = lazy(() => import('@/pages/partners/VendreEnLigne'));
const SignalerProbleme = lazy(() => import('@/pages/support/SignalerProbleme'));
const Expansion = lazy(() => import('@/pages/locations/Expansion'));
const Demo = lazy(() => import('@/pages/demo/Demo'));
const ProgrammePartenaire = lazy(() => import('@/pages/partner/ProgrammePartenaire'));
const CarteCouverture = lazy(() => import('@/pages/locations/CarteCouverture'));
const UnifiedTracking = lazy(() => import('@/pages/UnifiedTracking'));
const VendorShop = lazy(() => import('@/pages/VendorShop'));
const RestaurantPublicPage = lazy(() => import('@/pages/PublicRestaurantPage'));

// Test pages — dev only
const testPages = import.meta.env.DEV ? {
  AuthSystemTest: lazy(() => import('@/pages/test/AuthSystemTest')),
  TrackingTest: lazy(() => import('@/pages/test/TrackingTest')),
  ModernTrackingTest: lazy(() => import('@/pages/test/ModernTrackingTest')),
  ModernNavigationTest: lazy(() => import('@/pages/test/ModernNavigationTest').then(m => ({ default: m.ModernNavigationTest }))),
  SmartLocationTest: lazy(() => import('@/pages/test/SmartLocationTest')),
  UniversalLocationTest: lazy(() => import('@/pages/test/UniversalLocationTest')),
  UniversalLocationTestAdvanced: lazy(() => import('@/pages/test/UniversalLocationTestAdvanced')),
  EdgeFunctionTest: lazy(() => import('@/pages/test/EdgeFunctionTest')),
  DispatchSystemTest: lazy(() => import('@/pages/test/DispatchSystemTest')),
  DispatchValidationTest: lazy(() => import('@/pages/test/DispatchValidationTest')),
  MapValidationTest: lazy(() => import('@/pages/test/MapValidationTest')),
  ModernMapDemo: lazy(() => import('@/pages/test/ModernMapDemo')),
  ComponentsDemo: lazy(() => import('@/pages/test/ComponentsDemo').then(m => ({ default: m.ComponentsDemo }))),
  NativeFeatureCheck: lazy(() => import('@/pages/test/NativeFeatureCheck')),
} : null;

export const PublicRoutes = () => {

  return (
    <>
      {/* Support & Legal */}
      <Route path="/support/help-center" element={<HelpCenter />} />
      <Route path="/support/contact" element={<Contact />} />
      <Route path="/support/faq" element={<FAQ />} />
      <Route path="/legal/terms" element={<Terms />} />
      <Route path="/legal/privacy" element={<Privacy />} />
      <Route path="/legal/cookies" element={<Cookies />} />
      <Route path="/legal/legal-notice" element={<LegalNotice />} />
      
      {/* Locations */}
      <Route path="/locations/kinshasa" element={<Kinshasa />} />
      <Route path="/locations/lubumbashi" element={<Lubumbashi />} />
      <Route path="/locations/kolwezi" element={<Kolwezi />} />
      <Route path="/locations/expansion" element={<Expansion />} />
      <Route path="/locations/coverage-map" element={<CarteCouverture />} />
      
      {/* Services */}
      <Route path="/services/taxi-vtc" element={<TransportVTC />} />
      <Route path="/services/livraison-express" element={<LivraisonExpress />} />
      <Route path="/services/location-vehicules" element={<LocationVehicules />} />
      
      {/* Partners */}
      <Route path="/partners/devenir-chauffeur" element={<DevenirChauffeur />} />
      <Route path="/partners/louer-vehicule" element={<LouerVehicule />} />
      <Route path="/partners/devenir-livreur" element={<DevenirLivreur />} />
      <Route path="/partners/vendre-en-ligne" element={<VendreEnLigne />} />
      
      {/* About & Misc */}
      <Route path="/about" element={<About />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/debug/update" element={<DebugUpdate />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/partner" element={<ProgrammePartenaire />} />
      <Route path="/support/signaler-probleme" element={<SignalerProbleme />} />
      <Route path="/tracking/:type/:id" element={<UnifiedTracking />} />
      
      {/* ✅ Routes publiques pour partage */}
      <Route path="/marketplace/shop/:vendorId" element={<VendorShop />} />
      <Route path="/food/restaurant/:restaurantId" element={<RestaurantPublicPage />} />
      
      {/* Test Routes — dev only */}
      {testPages && (
        <>
          <Route path="/test/auth-system" element={<testPages.AuthSystemTest />} />
          <Route path="/test/tracking" element={<testPages.TrackingTest />} />
          <Route path="/test/modern-tracking" element={<testPages.ModernTrackingTest />} />
          <Route path="/test/modern-navigation" element={<testPages.ModernNavigationTest />} />
          <Route path="/test/intelligent-location" element={<testPages.SmartLocationTest />} />
          <Route path="/test/universal-location" element={<testPages.UniversalLocationTest />} />
          <Route path="/test/universal-location-advanced" element={<testPages.UniversalLocationTestAdvanced />} />
          <Route path="/test/edge-functions" element={<testPages.EdgeFunctionTest />} />
          <Route path="/test/dispatch-system" element={<testPages.DispatchSystemTest />} />
          <Route path="/test/dispatch-validation" element={<testPages.DispatchValidationTest />} />
          <Route path="/test/map-validation" element={<testPages.MapValidationTest />} />
          <Route path="/test/modern-map" element={<testPages.ModernMapDemo />} />
          <Route path="/test/components" element={<testPages.ComponentsDemo />} />
          <Route path="/test/native-check" element={<testPages.NativeFeatureCheck />} />
        </>
      )}
    </>
  );
};
