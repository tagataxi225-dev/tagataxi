import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ServiceGuard } from '@/components/guards/ServiceGuard';
import { VendorGuard } from '@/components/guards/VendorGuard';
const TransportPage = lazy(() => import('@/pages/Transport'));


// Lazy imports
const ClientApp = lazy(() => import('@/pages/ClientApp'));
const Food = lazy(() => import('@/pages/Food'));
const FoodOrders = lazy(() => import('@/pages/food/FoodOrders'));
const FoodFavorites = lazy(() => import('@/pages/food/FoodFavorites'));
const FoodExplore = lazy(() => import('@/pages/food/FoodExplore'));
const FoodPromos = lazy(() => import('@/pages/food/FoodPromos'));
const DeliveryPage = lazy(() => import('@/pages/Delivery'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const MarketplaceProductDetails = lazy(() => import('@/pages/MarketplaceProductDetails'));
const VendorShop = lazy(() => import('@/pages/VendorShop'));
const ModernVendorDashboard = lazy(() => import('@/pages/ModernVendorDashboard'));
const VendorSetupWizard = lazy(() => import('@/components/vendor/VendorSetupWizard'));
const VendorAddProduct = lazy(() => import('@/pages/VendorAddProduct'));
const VendorEditProduct = lazy(() => import('@/pages/VendorEditProduct'));
const VendorChatConversation = lazy(() => import('@/pages/VendorChatConversation'));
const ClientRentalInterface = lazy(() => import('@/pages/ClientRentalInterface'));
const RentalVehicleDetails = lazy(() => import('@/pages/RentalVehicleDetails'));
const SoftRentalBooking = lazy(() => import('@/components/rental/soft/SoftRentalBooking'));
const ClientRentalBookings = lazy(() => import('@/pages/rental/ClientRentalBookings'));
const PartnerRentalStoreView = lazy(() => import('@/components/rental/PartnerRentalStoreView'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));
const PromosPage = lazy(() => import('@/pages/PromosPage'));
const FeaturedDishes = lazy(() => import('@/pages/food/FeaturedDishes'));
const TrendingProducts = lazy(() => import('@/pages/marketplace/TrendingProducts'));
const MesAdresses = lazy(() => import('@/pages/address/MesAdresses'));
const ClientVerifyEmail = lazy(() => import('@/pages/ClientVerifyEmail'));

export const ClientRoutes = () => {

  return (
    <>
      {/* Routes Client principales */}
      <Route path="/client/verify-email" element={<ClientVerifyEmail />} />
      <Route 
        path="/app/client" 
        element={
          <ProtectedRoute requiredRole="client">
            <ClientApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client" 
        element={
          <ProtectedRoute requiredRole="client">
            <ClientApp />
          </ProtectedRoute>
        } 
      />

      {/* Transport */}
      <Route
        path="/transport"
        element={
          <ServiceGuard serviceCategory="taxi">
            <ProtectedRoute>
              <TransportPage />
            </ProtectedRoute>
          </ServiceGuard>
        }
      />

      {/* Delivery */}
      <Route 
        path="/delivery" 
        element={
          <ServiceGuard serviceCategory="delivery">
            <ProtectedRoute>
              <DeliveryPage />
            </ProtectedRoute>
          </ServiceGuard>
        } 
      />

      {/* Food */}
      <Route 
        path="/food" 
        element={
          <ServiceGuard serviceCategory="food">
            <Food />
          </ServiceGuard>
        } 
      />

      {/* Food - Orders (avec redirection ancienne route) */}
      <Route 
        path="/app/client/food-orders" 
        element={
          <ServiceGuard serviceCategory="food">
            <ProtectedRoute>
              <Navigate to="/food/orders" replace />
            </ProtectedRoute>
          </ServiceGuard>
        } 
      />
      <Route 
        path="/food/orders" 
        element={
          <ServiceGuard serviceCategory="food">
            <ProtectedRoute>
              <FoodOrders />
            </ProtectedRoute>
          </ServiceGuard>
        } 
      />

      {/* Food - Favorites */}
      <Route 
        path="/food/favorites" 
        element={
          <ServiceGuard serviceCategory="food">
            <ProtectedRoute>
              <FoodFavorites />
            </ProtectedRoute>
          </ServiceGuard>
        } 
      />

      {/* Food - Explore */}
      <Route 
        path="/food/explore" 
        element={
          <ServiceGuard serviceCategory="food">
            <FoodExplore />
          </ServiceGuard>
        } 
      />

      {/* Food - Promos */}
      <Route 
        path="/food/promos" 
        element={
          <ServiceGuard serviceCategory="food">
            <FoodPromos />
          </ServiceGuard>
        } 
      />

      {/* Food - Vedette (pas de ServiceGuard, extension de l'accueil) */}
      <Route path="/food/vedette" element={<FeaturedDishes />} />

      {/* Marketplace - Tendance (pas de ServiceGuard, extension de l'accueil) */}
      <Route path="/marketplace/tendance" element={<TrendingProducts />} />

      {/* Marketplace */}
      <Route
        path="/marketplace" 
        element={
          <ServiceGuard serviceCategory="marketplace">
            <Marketplace />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/marketplace/product/:productId" 
        element={
          <ServiceGuard serviceCategory="marketplace">
            <MarketplaceProductDetails />
          </ServiceGuard>
        } 
      />

      {/* Vendeur */}
      <Route 
        path="/vendeur/inscription" 
        element={
          <ProtectedRoute>
            <VendorSetupWizard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vendeur" 
        element={
          <VendorGuard>
            <ModernVendorDashboard />
          </VendorGuard>
        } 
      />
      <Route 
        path="/vendeur/ajouter-produit" 
        element={
          <VendorGuard>
            <VendorAddProduct />
          </VendorGuard>
        } 
      />
      <Route 
        path="/vendeur/modifier-produit/:id" 
        element={
          <VendorGuard>
            <VendorEditProduct />
          </VendorGuard>
        } 
      />
      <Route 
        path="/marketplace/vendor/chat/:conversationId" 
        element={
          <VendorGuard>
            <VendorChatConversation />
          </VendorGuard>
        } 
      />

      {/* Location de véhicules */}
      <Route 
        path="/rental" 
        element={
          <ServiceGuard serviceCategory="rental">
            <ClientRentalInterface />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/rental/partner/:partnerId/shop" 
        element={
          <ServiceGuard serviceCategory="rental">
            <PartnerRentalStoreView />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/rental/:vehicleId/details" 
        element={
          <ServiceGuard serviceCategory="rental">
            <RentalVehicleDetails />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/rental-booking/:vehicleId" 
        element={
          <ProtectedRoute>
            <SoftRentalBooking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rental/bookings" 
        element={
          <ProtectedRoute>
            <ClientRentalBookings />
          </ProtectedRoute>
        } 
      />

      {/* Autres pages client */}
      <Route 
        path="/mes-adresses" 
        element={
          <ProtectedRoute>
            <MesAdresses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/referral" 
        element={
          <ProtectedRoute>
            <ReferralPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/promos" 
        element={
          <ProtectedRoute>
            <PromosPage />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
