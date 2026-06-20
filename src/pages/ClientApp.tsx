import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ModernJobInterface } from "@/components/job/modern/ModernJobInterface";
import { supabase } from "@/integrations/supabase/client";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { FloatingChatButton } from "@/components/home/FloatingChatButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { welcomeCarouselUtils } from "@/utils/welcomeCarousel";

import {
  ConnectionIndicator,
  OptimizedImage,
  ProgressiveLoader,
  useDataCompression,
} from "@/components/optimization/SlowConnectionComponents";
import SimplifiedInterface from "@/components/ui/SimplifiedInterface";
import MobileMoneyPayment from "@/components/advanced/MobileMoneyPayment";
// import { ReferralPanel } from '@/components/profile/ReferralPanel'; // Supprimé
import NotificationCenter from "@/components/advanced/NotificationCenter";
import OfflineMode from "@/components/advanced/OfflineMode";
import SecurityVerification from "@/components/advanced/SecurityVerification";
import { ResponsiveUserProfile } from "@/components/profile/ResponsiveUserProfile";
import { ClientWalletPanel } from "@/components/client/ClientWalletPanel";
import { QuickTransferPopup } from "@/components/wallet/QuickTransferPopup";
import { ModernHomeScreen } from "@/components/home/ModernHomeScreen";
import { ModernBottomNavigation } from "@/components/home/ModernBottomNavigation";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { MobileOptimizedLayout } from "@/components/layout/MobileOptimizedLayout";
import ModernTaxiInterface from "@/components/transport/ModernTaxiInterface";
import { TransportErrorBoundary } from "@/components/transport/TransportErrorBoundary";
import StepByStepDeliveryInterface from "@/components/delivery/StepByStepDeliveryInterface";
import { FoodOrderInterface } from "@/components/food/FoodOrderInterface";
import { FoodOrderTracking } from "@/components/food/FoodOrderTracking";
import { VerificationDocumentUpload } from "@/components/client/VerificationDocumentUpload";
import {
  MapPin,
  Car,
  Clock,
  Star,
  User,
  CreditCard,
  History,
  Home,
  Building2,
  ArrowLeft,
  Bell,
  Leaf,
  Shield,
  Truck,
  Package,
  Store,
  Plus,
  Search,
  Camera,
  Upload,
  Activity,
  Bike,
  Heart,
  Zap,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Transport components - simplified
import TripChat from "@/components/transport/TripChat";

// Delivery components - simplified
import DeliveryTrackingHub from "@/components/delivery/DeliveryTrackingHub";
import AdvancedTaxiTracker from "@/components/transport/AdvancedTaxiTracker";

// Rental components
import FluidRentalInterface from "@/components/rental/FluidRentalInterface";
import ModernRentalScreen from "@/components/rental/ModernRentalScreen";
import ModernRentalBooking from "@/components/rental/ModernRentalBooking";

// Marketplace components
import { EnhancedMarketplaceInterface } from "@/components/marketplace/EnhancedMarketplaceInterface";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LazyLoadWrapper } from "@/components/performance/LazyLoadWrapper";
import { PerformanceIndicator } from "@/components/performance/PerformanceIndicator";
import { OptimizedGrid } from "@/components/performance/OptimizedGrid";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// Chat and order components
// ModernChatInterface removed - use UniversalChatInterface directly
import { OrderManagement } from "@/components/marketplace/OrderManagement";
import { CreateOrderDialog } from "@/components/marketplace/CreateOrderDialog";
import { ActivityTab } from "@/components/marketplace/ActivityTab";
import { EditProductForm } from "@/components/marketplace/EditProductForm";

// Testing components
import { TestDataGenerator } from "@/components/testing/TestDataGenerator";

// Hooks
import { useViewTransition } from "@/hooks/useViewTransition";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { useAuth } from "@/hooks/useAuth";
import { dataCache } from "@/services/dataCache";
import { useQueryClient } from "@tanstack/react-query";
import { retryWithBackoff } from "@/utils/retryWithBackoff";
import { logDataLoss } from "@/utils/errorLogger";
import { useEnhancedDeliveryOrders } from "@/hooks/useEnhancedDeliveryOrders";
import { useTabScrollReset } from "@/hooks/useTabScrollReset";
import { LotteryDashboard } from "@/components/lottery/LotteryDashboard";
import { useLotteryTickets } from "@/hooks/useLotteryTickets";
import { UnifiedActivityScreen } from "@/components/activity/UnifiedActivityScreen";
import { CancellationNotification } from "@/components/notifications/CancellationNotification";
import { ServiceWelcomeCarousel } from "@/components/onboarding/ServiceWelcomeCarousel";
import { serviceWelcomeSlides } from "@/data/serviceWelcome";
import { PhonePromptModal } from "@/components/auth/PhonePromptModal";

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
  type?: "home" | "work" | "other" | "recent" | "favorite";
}

interface Vehicle {
  id: string;
  name: string;
  type: "moto" | "eco" | "standard" | "premium" | "bus";
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  multiplier: number;
  available: boolean;
  capacity: number;
  price?: number;
}

interface PackageType {
  id: string;
  name: string;
  description: string;
  maxWeight: string;
  maxDimensions: string;
  basePrice: number;
  estimatedTime: string;
  icon: string;
  popular?: boolean;
  examples: string[];
}

const ClientApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, formatCurrency } = useLanguage();
  const { compressData, decompressData } = useDataCompression();
  const { optimizations, measureLoadTime } = usePerformanceMonitor();
  const { transitionToView } = useViewTransition();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState("home");
  const [serviceType, setServiceType] = useState<"transport" | "delivery" | "marketplace" | "rental" | "food" | "job">(
    "transport",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  // Bottom navigation state
  const [activeTab, setActiveTab] = useState("home");

  // ✅ Scroll automatique au changement d'onglet
  useTabScrollReset(activeTab, {
    behavior: "smooth",
    delay: 50,
  });

  // ✅ Scroll aussi au changement de vue (service, profil, etc.)
  useTabScrollReset(currentView, {
    behavior: "smooth",
    delay: 50,
  });

  // Wallet top-up modal control
  const [shouldOpenWalletTopUp, setShouldOpenWalletTopUp] = useState(false);

  // Quick transfer popup state
  const [showQuickTransfer, setShowQuickTransfer] = useState(false);

  // Transport states
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isTripChatOpen, setIsTripChatOpen] = useState(false);

  // Cancellation notification state
  const [showCancellationPrompt, setShowCancellationPrompt] = useState(false);

  // Welcome carousel state
  const [showWelcomeCarousel, setShowWelcomeCarousel] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Prefill for taxi when coming from home search
  type TaxiPrefill = {
    pickup?: Location;
    destination?: Location;
  };
  const [taxiPrefill, setTaxiPrefill] = useState<TaxiPrefill>({});

  // Remove old transport booking hook since it's now integrated

  // Delivery states
  const [deliveryStep, setDeliveryStep] = useState<"interface" | "tracking">("interface");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [deliveryOrderData, setDeliveryOrderData] = useState<any | null>(null);

  // Rental states
  const [rentalStep, setRentalStep] = useState<"interface" | "confirmation">("interface");
  const [rentalBooking, setRentalBooking] = useState<any>(null);

  // Marketplace state - simplified as it's now handled by EnhancedMarketplaceInterface
  const { toast } = useToast();

  // Chat and order hooks
  const ordersHook = useMarketplaceOrders();
  const { createDeliveryOrder } = useEnhancedDeliveryOrders();

  // Lottery hooks
  const lotteryTickets = useLotteryTickets();

  // Simplified marketplace data for home preview only
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Auto-attribution des tickets de connexion quotidienne
  useEffect(() => {
    if (user) {
      lotteryTickets.awardDailyLoginTickets();
    }
  }, [user]);

  // Prompt téléphone si manquant
  useEffect(() => {
    if (!user?.id) return;
    const dismissed = localStorage.getItem("kwenda_phone_prompt_dismissed");
    if (dismissed === "true") return;

    const checkPhone = async () => {
      const { data } = await supabase.from("clients").select("phone_number").eq("user_id", user.id).maybeSingle();

      if (data && (!data.phone_number || data.phone_number.trim() === "")) {
        setShowPhonePrompt(true);
      }
    };
    checkPhone();
  }, [user?.id]);

  // ✅ Afficher le carrousel de bienvenue une fois par jour (HOME uniquement)
  useEffect(() => {
    if (currentView !== 'home') return;
    const isDev = import.meta.env.DEV;

    if (welcomeCarouselUtils.shouldShow() || isDev) {
      const timer = setTimeout(() => {
        setShowWelcomeCarousel(true);
        if (!isDev) {
          welcomeCarouselUtils.markAsShown();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // ✅ Fermer les overlays quand on quitte le home
  useEffect(() => {
    if (currentView !== 'home') {
      setShowWelcomeCarousel(false);
      setShowPhonePrompt(false);
    }
  }, [currentView]);

  // Gérer l'ouverture du modal de rechargement depuis la navigation
  useEffect(() => {
    if (location.state?.openWalletTopUp) {
      setCurrentView("wallet");
      setActiveTab("wallet");
      setShouldOpenWalletTopUp(true);
      // Nettoyer le state pour éviter réouverture
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ✅ PHASE 2 : Prefetch stratégique des données probables
  useEffect(() => {
    if (!user) return;

    console.log("🚀 [ClientApp] Prefetch stratégique des données...");

    // Prefetch restaurants (l'utilisateur va probablement commander)
    queryClient.prefetchQuery({
      queryKey: ["restaurants", "Kinshasa"], // TODO: Utiliser la ville de l'utilisateur
      queryFn: async () => {
        const { data } = await supabase
          .from("restaurant_profiles")
          .select("*")
          .ilike("city", "Kinshasa")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        return data || [];
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Prefetch marketplace products
    queryClient.prefetchQuery({
      queryKey: [
        "all-marketplace-products",
        {
          search: "",
          categories: [],
          priceRange: [0, 2000000],
          conditions: [],
          minRating: 0,
          maxDistance: 50,
          availableOnly: false,
        },
        { field: "popularity_score", direction: "desc" },
        1,
      ],
      queryFn: async () => {
        const { data } = await supabase
          .from("marketplace_products")
          .select(
            `
            *,
            vendor_profiles!inner(
              shop_name,
              shop_logo_url,
              average_rating,
              total_sales
            )
          `,
          )
          .eq("status", "active")
          .eq("moderation_status", "approved")
          .order("popularity_score", { ascending: false })
          .range(0, 19);
        return { products: data || [], totalCount: 0, totalPages: 0 };
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    console.log("✅ [ClientApp] Prefetch terminé");
  }, [user, queryClient]);

  // Fetch products from Supabase - ✅ Avec cache persistant et retry logic
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      setIsLoadingProducts(true);

      try {
        // ✅ 1. Essayer de charger depuis le cache
        const cachedProducts = dataCache.get<any[]>("marketplace_products", user.id);
        if (cachedProducts && cachedProducts.length > 0) {
          console.log("📦 [ClientApp] Produits chargés depuis le cache");
          setMarketplaceProducts(cachedProducts);
          setIsLoadingProducts(false);
        }

        // ✅ 2. Charger depuis Supabase avec retry logic
        const result = await retryWithBackoff(
          async () => {
            const { data: publicProducts, error: publicError } = await supabase
              .from("marketplace_products")
              .select("*")
              .eq("status", "active")
              .eq("moderation_status", "approved")
              .order("created_at", { ascending: false });

            let sellerProducts: any[] = [];
            if (user) {
              const { data: myProducts } = await supabase
                .from("marketplace_products")
                .select("*")
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

              if (myProducts) {
                sellerProducts = myProducts;
              }
            }

            const allProducts = [
              ...sellerProducts,
              ...(publicProducts || []).filter((p) => !sellerProducts.some((sp) => sp.id === p.id)),
            ];

            if (publicError) throw publicError;

            return allProducts;
          },
          3,
          1000,
        );

        console.log(`Produits chargés: ${result.length} depuis Supabase`);

        // ✅ 3. Transformer et sauvegarder dans le cache
        const transformedProducts = result.map((product) => ({
          id: product.id,
          name: product.title,
          price: product.price,
          image:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop",
          images: Array.isArray(product.images) ? product.images : [],
          rating: 4.5,
          reviews: Math.floor(Math.random() * 200) + 10,
          seller: "Vendeur TAGA",
          category: product.category?.toLowerCase() || "other",
          description: product.description || "",
          specifications: {},
          inStock: (product.stock_count || 0) > 0 && product.status === "active",
          stockCount: product.stock_count || 0,
          isTrending: product.featured || false,
          trendingScore: product.featured ? Math.floor(Math.random() * 30) + 70 : 0,
          condition: product.condition,
          location: product.location,
          coordinates: product.coordinates,
          moderationStatus: product.moderation_status,
          productStatus: product.status,
          isOwnProduct: user?.id === product.seller_id,
        }));

        setMarketplaceProducts(transformedProducts);
        dataCache.set("marketplace_products", transformedProducts, user.id);
      } catch (error) {
        logDataLoss("ClientApp.fetchProducts", error);
        console.error("❌ Erreur fatale:", error);

        // ✅ Fallback au cache en cas d'erreur
        const cachedProducts = dataCache.get<any[]>("marketplace_products", user.id);
        if (cachedProducts && cachedProducts.length > 0) {
          console.log("🔄 [ClientApp] Utilisation du cache suite à une erreur");
          setMarketplaceProducts(cachedProducts);
          toast({
            title: "⚠️ Mode hors ligne",
            description: "Affichage des données en cache. Vérifiez votre connexion.",
          });
        } else {
          toast({
            title: t("common.error"),
            description: t("client.error_load_products"),
            variant: "destructive",
          });
        }
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [user?.id]);

  // Use either real products or fallback to empty array
  const mockProducts = marketplaceProducts;

  // Products available for home preview
  const homeProducts = marketplaceProducts.slice(0, 4).map((p) => ({ ...p, isPopular: Math.random() > 0.5 }));

  const handleServiceSelect = (service: string) => {
    // ✅ Gestion activité/historique
    if (service === "history" || service === "activity") {
      setCurrentView("history");
      setActiveTab("activity");
      return;
    }

    // ✅ Gestion wallet
    if (service === "wallet") {
      setCurrentView("wallet");
      setActiveTab("profil");
      return;
    }

    // ✅ Gestion settings/paramètres
    if (service === "settings" || service === "parametres") {
      setCurrentView("profil");
      setActiveTab("profil");
      return;
    }

    // ✅ Gestion support
    if (service === "support" || service === "help") {
      toast({
        title: "Support client",
        description: "Notre équipe est disponible 24/7 pour vous aider",
      });
      // TODO: Ouvrir chat support ou page dédiée
      return;
    }

    // ✅ Gestion suivi de course taxi depuis le widget accueil
    if (service.startsWith("taxi-tracking:")) {
      const bookingId = service.split(":")[1];
      if (bookingId) {
        setTrackingBookingId(bookingId);
        setServiceType("transport");
        setCurrentView("service");
        setActiveTab("home");
      }
      return;
    }

    // ✅ Gestion rental avec retour
    if (service === "rental") {
      navigate("/rental", { state: { returnTo: "/app/client" } });
      return;
    }

    // ✅ Gestion lottery
    if (service === "lottery" || service === "tombola") {
      setCurrentView("lottery");
      return;
    }

    // ✅ Gestion job
    if (service === "job") {
      setServiceType("job");
      setCurrentView("service");
      setActiveTab("home");
      return;
    }

    // ✅ Gestion transfert rapide
    if (service === "transfer") {
      setShowQuickTransfer(true);
      return;
    }

    // ✅ Gestion profil
    if (service === "profil" || service === "profile") {
      setCurrentView("profil");
      setActiveTab("profil");
      return;
    }

    // ✅ Gestion food
    if (service === "food") {
      setServiceType("food");
      setCurrentView("service");
      setActiveTab("home");
      return;
    }

    // ✅ Services principaux (transport, delivery, marketplace)
    setServiceType(service as any);
    setCurrentView("service");
    setActiveTab("home");
    if (service === "delivery") {
      setDeliveryStep("interface");
    } else if (service === "marketplace") {
      // Marketplace handled by EnhancedMarketplaceInterface
    } else if (service === "rental") {
      setRentalStep("interface");
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        setCurrentView("home");
        break;
      case "activity":
        setCurrentView("history");
        break;
      case "profil":
        setCurrentView("profil");
        break;
    }
  };

  const handleUniversalSearch = (query: string, coordinates?: { lat: number; lng: number }) => {
    // Prefill taxi and navigate to transport
    setServiceType("transport");
    setCurrentView("service");
    setTaxiPrefill({
      destination: {
        address: query,
        coordinates: coordinates || { lat: 0, lng: 0 },
      },
    });
  };

  const handleMarketplaceViewAll = () => {
    setServiceType("marketplace");
    setCurrentView("service");
  };

  const renderHome = () => {
    return (
      <ModernHomeScreen
        onServiceSelect={handleServiceSelect}
        onSearch={handleUniversalSearch}
        onNavigateToTestData={() => setCurrentView("test-data")}
        onDeliveryTrackingOpen={(orderId) => {
          setDeliveryId(orderId);
          setDeliveryStep("tracking");
          setServiceType("delivery");
          setCurrentView("service");
        }}
      />
    );
  };

  // Transport handlers
  const handleTransportSubmit = async (data: any) => {
    try {
      console.log("=== Création de réservation transport ===", data);

      // Set transport tracking state
      setActiveBooking(data);

      // Award lottery tickets for transport
      await lotteryTickets.awardTransportTickets(data.bookingId);

      // Only show success toast if a driver is actually assigned
      if (data.status === "driver_assigned" && data.driverAssigned) {
        toast({
          title: t("client.booking_confirmed"),
          description: t("client.driver_arriving", { minutes: data.driverAssigned.estimatedArrival || 5 }),
        });
      }

      console.log("Transport réservé:", data);
    } catch (error) {
      console.error("Erreur création transport:", error);
    }
  };

  // renderTaxiService removed — transport now rendered directly as fullscreen service

  // Delivery handlers
  const handleModernDeliverySubmit = async (data: any) => {
    try {
      console.log("=== Création de commande de livraison ===", data);

      // Utiliser le hook pour créer une vraie commande avec UUID
      const orderId = await createDeliveryOrder(data);
      console.log("Commande créée avec ID:", orderId);

      // Définir l'ID réel pour le tracking
      setDeliveryId(orderId);
      setDeliveryStep("tracking");

      // Attribuer des tickets pour la livraison
      await lotteryTickets.awardDeliveryTickets(orderId);

      toast({
        title: t("client.delivery_confirmed"),
        description: t("client.package_pickup_soon"),
      });

      console.log("Livraison créée:", { id: orderId, ...data });
    } catch (error) {
      console.error("Erreur création livraison:", error);
    }
  };

  const handleDeliveryComplete = () => {
    // Reset delivery state
    setDeliveryStep("interface");
    setDeliveryId(null);
  };

  // Rental handlers
  const handleRentalBookingComplete = (booking: any) => {
    setRentalBooking(booking);
    setRentalStep("confirmation");

    toast({
      title: t("client.booking_confirmed"),
      description: t("client.rental_confirmed", { vehicle: booking.vehicle.name }),
    });
  };

  const handleRentalComplete = () => {
    setRentalStep("interface");
    setRentalBooking(null);
  };

  const renderRentalService = () => {
    if (rentalStep === "confirmation" && rentalBooking) {
      return (
        <div className="bg-background p-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t("client.booking_confirmed")}</h2>
                <p className="text-muted-foreground">{t("client.vehicle_reserved")}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{rentalBooking.vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rentalBooking.vehicle.brand} {rentalBooking.vehicle.model}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("client.start_date")}</p>
                    <p className="font-medium">{format(rentalBooking.startDate, "dd/MM/yyyy", { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("client.end_date")}</p>
                    <p className="font-medium">{format(rentalBooking.endDate, "dd/MM/yyyy", { locale: fr })}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm">Prix total</p>
                  <p className="text-2xl font-bold text-primary">{rentalBooking.totalPrice.toLocaleString()} CDF</p>
                </div>
              </div>

              <Button onClick={handleRentalComplete} className="w-full mt-6">
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Check if we're in booking mode via URL
    const pathParts = window.location.pathname.split("/");
    if (pathParts.includes("rental-booking")) {
      return <ModernRentalBooking />;
    }

    return <ModernRentalScreen />;
  };

  const calculateDeliveryPrice = (packageType: PackageType, pickup: string, destination: string) => {
    // Simple distance calculation simulation
    const baseDistance = 5; // km
    const pricePerKm = 300; // FC per km
    const totalPrice = packageType.basePrice + baseDistance * pricePerKm;
    return totalPrice;
  };

  // Marketplace now handled by EnhancedMarketplaceInterface

  // renderDeliveryService removed — delivery tracking now rendered as fullscreen, form inline

  // Marketplace now handled by EnhancedMarketplaceInterface

  const [profileError, setProfileError] = useState<string | null>(null);

  const renderProfile = () => (
    <div className="flex-1 overflow-y-auto bg-background safe-area-inset" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      {/* ✅ Message erreur si échec chargement profil */}
      {profileError && (
        <div className="px-4 mb-4 pt-4">
          <div
            className={`p-4 rounded-lg border ${
              profileError.includes("permission") || profileError.includes("Accès refusé")
                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  profileError.includes("permission")
                    ? "bg-yellow-100 dark:bg-yellow-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 ${
                    profileError.includes("permission")
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    profileError.includes("permission")
                      ? "text-yellow-800 dark:text-yellow-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {profileError}
                </p>
                {!profileError.includes("permission") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProfileError(null);
                      window.location.reload();
                    }}
                    className="mt-2"
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ResponsiveUserProfile
        userType="client"
        onWalletAccess={() => {
          console.log("🚀 [ClientApp] onWalletAccess déclenché, changement vers wallet...");
          setCurrentView("wallet");
          console.log('✅ [ClientApp] setCurrentView("wallet") exécuté');
        }}
        onViewChange={(view) => {
          console.log("🔄 [ClientApp] onViewChange vers:", view);
          setCurrentView(view);
        }}
        onClose={() => {
          console.log("🚪 [ClientApp] onClose - retour à home");
          setCurrentView("home");
        }}
      />
    </div>
  );

  const renderHistory = () => <UnifiedActivityScreen onBack={() => setCurrentView("home")} />;

  const renderWallet = () => (
    <div className="bg-background safe-area-inset">
      {/* Header premium sticky avec safe area iOS */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/10 pt-safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView("home")}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">TAGAPay</h1>
          </div>
          <div className="p-2 rounded-xl bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>
      <ClientWalletPanel
        initialTopUpOpen={shouldOpenWalletTopUp}
        onTopUpModalChange={(open) => {
          if (!open) setShouldOpenWalletTopUp(false);
        }}
      />
    </div>
  );

  const renderPayment = () => (
    <div className="bg-background safe-area-inset">
      {/* Header sticky avec safe area iOS */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/10 pt-safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView("home")}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Paiements</h1>
          </div>
          <div className="p-2 rounded-xl bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>
      <div className="p-4">
        <div className="space-y-4">
          <Card className="card-floating border-0">
            <CardHeader>
              <CardTitle className="text-heading-md">Moyens de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Orange Money", primary: true, icon: "🟠" },
                { name: "MTN Money", primary: false, icon: "🟡" },
                { name: "Espèces", primary: false, icon: "💵" },
              ].map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-grey-50 rounded-xl border border-transparent hover:border-grey-200 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-body-md font-medium text-card-foreground">{method.name}</span>
                  </div>
                  {method.primary && (
                    <span className="text-caption font-semibold text-primary bg-primary-light px-2 py-1 rounded-md">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full h-12 rounded-xl text-body-md font-semibold">Ajouter un moyen de paiement</Button>
        </div>
      </div>
    </div>
  );

  // Determine if current service is fullscreen (manages its own scroll/layout)
  const isFullscreenService =
    currentView === "service" &&
    (serviceType === "transport" || (serviceType === "delivery" && deliveryStep === "tracking"));

  // Bottom nav only shows on home + activity. All other views (profile, wallet,
  // payment, services, notifications, etc.) manage their own footer/CTA.
  const showBottomNav =
    currentView === "home" ||
    currentView === "activity" ||
    currentView === "history";

  return (
    <>
      <ChatProvider>
        <div className="h-dvh flex flex-col bg-background overflow-hidden safe-area-inset">
          {/* Loading State */}
          {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <ProgressiveLoader message="Chargement optimisé..." />
            </div>
          )}

          {/* ===== FULLSCREEN SERVICES (transport, delivery tracking) ===== */}
          {/* Rendered directly in the h-dvh flex container — no scrollable wrapper */}
          {isFullscreenService ? (
            <div className="flex-1 overflow-hidden">
              {serviceType === "transport" && (
                trackingBookingId ? (
                  <TransportErrorBoundary>
                    <AdvancedTaxiTracker
                      bookingId={trackingBookingId}
                      onBack={() => {
                        setTrackingBookingId(null);
                        setCurrentView("home");
                      }}
                    />
                  </TransportErrorBoundary>
                ) : (
                  <>
                    <TransportErrorBoundary>
                      <ModernTaxiInterface
                        onSubmit={handleTransportSubmit}
                        onCancel={() => setCurrentView("home")}
                        onTrackDriver={(bookingId: string) => setTrackingBookingId(bookingId)}
                      />
                    </TransportErrorBoundary>
                    {isTripChatOpen && activeBooking && (
                      <TripChat
                        bookingId={activeBooking.id}
                        driverInfo={activeBooking.driver}
                        userType="client"
                        onClose={() => setIsTripChatOpen(false)}
                      />
                    )}
                  </>
                )
              )}
              {serviceType === "delivery" && deliveryStep === "tracking" && deliveryId && (
                <DeliveryTrackingHub
                  orderId={deliveryId}
                  onBack={() => {
                    setDeliveryStep("interface");
                    setDeliveryId(null);
                    setCurrentView("home");
                  }}
                />
              )}
            </div>
          ) : (
            /* ===== SCROLLABLE CONTENT (home, food, marketplace, delivery form, etc.) ===== */
            <main
              className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide",
                showBottomNav && "pb-[var(--bottom-nav-height-safe,96px)]",
                !showBottomNav && "pb-0",
              )}
              style={{ touchAction: 'pan-y', overscrollBehaviorY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView === 'service' ? `service-${serviceType}` : currentView}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full"
                >
              {(() => {
                if (currentView === "service") {
                  switch (serviceType) {
                    case "delivery":
                      return (
                        <StepByStepDeliveryInterface
                          onSubmit={handleModernDeliverySubmit}
                          onCancel={() => setCurrentView("home")}
                        />
                      );
                    case "rental":
                      return renderRentalService();
                    case "marketplace":
                      return <EnhancedMarketplaceInterface onNavigate={(path) => setCurrentView("home")} />;
                    case "food":
                      return (
                        <FoodOrderInterface
                          onOrderComplete={(orderId) => {
                            toast({
                              title: t("client.order_placed"),
                              description: t("client.order_confirmed"),
                            });
                          }}
                          onBack={() => setCurrentView("home")}
                        />
                      );
                    case "job":
                      return <ModernJobInterface onBack={() => setCurrentView("home")} />;
                    default:
                      return renderHome();
                  }
                }

                switch (currentView) {
                  case "profil":
                  case "profile":
                    return renderProfile();
                  case "activity":
                  case "history":
                    return renderHistory();
                  case "paiement":
                  case "payment":
                    return renderPayment();
                  case "wallet":
                    return renderWallet();
                  case "notifications":
                    return <NotificationCenter />;
                  case "offline":
                    return <OfflineMode />;
                  case "security":
                    return <SecurityVerification />;
                  case "simplified":
                    return <SimplifiedInterface />;
                  case "mobile-money":
                    return (
                      <MobileMoneyPayment
                        amount={3500}
                        onSuccess={(transactionId) => {
                          console.log("Payment success:", transactionId);
                          setCurrentView("home");
                        }}
                        onCancel={() => setCurrentView("payment")}
                      />
                    );
                  case "lottery":
                  case "tombola":
                    return (
                      <div className="flex-1 bg-background pb-4">
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pt-safe-top">
                          <div className="flex items-center gap-3 p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCurrentView("home")}
                              className="rounded-full"
                            >
                              <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <h1 className="text-lg font-semibold text-foreground">Tombola TAGA</h1>
                            </div>
                          </div>
                        </div>
                        <LotteryDashboard hideHeader={true} />
                      </div>
                    );
                  default:
                    if (currentView !== "home") {
                      console.log("Vue non reconnue:", currentView, "- Redirection vers home");
                      setTimeout(() => setCurrentView("home"), 0);
                    }
                    return renderHome();
                }
              })()}
                </motion.div>
              </AnimatePresence>
            </main>
          )}

          {/* Footer de navigation - Only shown on home + activity */}
          {showBottomNav && (
            <ModernBottomNavigation
              activeTab={
                currentView === 'profil' || currentView === 'profile' ? 'profil'
                : currentView === 'activity' || currentView === 'history' ? 'activity'
                : 'home'
              }
              onTabChange={handleTabChange}
              notificationCount={0}
              favoritesCount={0}
            />
          )}

          {/* Toast notifications */}
          <div id="toast-container" />

          {/* Quick Transfer Popup */}
          <QuickTransferPopup
            open={showQuickTransfer}
            onClose={() => setShowQuickTransfer(false)}
            onTransferSuccess={() => {
              setShowQuickTransfer(false);
              toast({
                title: "Transfert réussi",
                description: "L'argent a été envoyé avec succès",
              });
            }}
          />

          {/* Cancellation notification */}
          <CancellationNotification
            isOpen={showCancellationPrompt}
            onClose={() => setShowCancellationPrompt(false)}
            onNewRide={() => {
              setShowCancellationPrompt(false);
              setCurrentView("transport");
            }}
          />

          {/* Welcome Carousel - uniquement sur home pour ne pas bloquer les services */}
          {currentView === 'home' && (
            <ServiceWelcomeCarousel
              open={showWelcomeCarousel}
              onOpenChange={setShowWelcomeCarousel}
              slides={serviceWelcomeSlides}
              onNavigate={(path) => {
                setShowWelcomeCarousel(false);
                if (path === "/food") {
                  handleServiceSelect("food");
                } else if (path === "/marketplace") {
                  handleServiceSelect("marketplace");
                } else if (path === "/transport") {
                  handleServiceSelect("transport");
                } else if (path === "/lottery") {
                  handleServiceSelect("lottery");
                }
              }}
            />
          )}
        </div>
      </ChatProvider>
      {currentView === 'home' && (
        <PhonePromptModal isOpen={showPhonePrompt} onClose={() => setShowPhonePrompt(false)} />
      )}
    </>
  );
};

export default ClientApp;
