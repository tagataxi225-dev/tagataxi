import React, { useState } from 'react';
import '@/styles/marketplace.css'; // Lazy-loaded: only when marketplace is accessed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Filter, Star, Heart, ShoppingCart, MapPin, 
  Truck, Clock, Shield, TrendingUp, Eye, ArrowRight,
  Package, Store, Tag, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import ModernFooter from "@/components/landing/ModernFooter";
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { AdvancedFilters } from '@/components/marketplace/AdvancedFilters';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { FilterDialog } from '@/components/marketplace/FilterDialog';
import { CompactProductCard } from '@/components/marketplace/CompactProductCard';
import { UnifiedShoppingCart } from '@/components/marketplace/cart/UnifiedShoppingCart';
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useGeolocation } from '@/hooks/useGeolocation';

const MarketplaceContent = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const { favoriteItems, toggleFavorite, isFavorite } = useFavorites();
  const { latitude, longitude } = useGeolocation();

  const categories = [
    { id: "all", name: "Tous", icon: <Package className="w-4 h-4" />, count: "500+" },
    { id: "electronics", name: "Électronique", icon: <Zap className="w-4 h-4" />, count: "120+" },
    { id: "fashion", name: "Mode", icon: <Tag className="w-4 h-4" />, count: "80+" },
    { id: "food", name: "Alimentation", icon: <Store className="w-4 h-4" />, count: "150+" },
    { id: "home", name: "Maison", icon: <Package className="w-4 h-4" />, count: "90+" },
    { id: "beauty", name: "Beauté", icon: <Heart className="w-4 h-4" />, count: "60+" }
  ];

  const featuredProducts = [
    {
      id: "1",
      name: "Samsung Galaxy A54",
      price: 450000,
      originalPrice: 550000,
      image: "/placeholder.svg",
      rating: 4.8,
      reviewCount: 45,
      seller: "TechStore Kinshasa",
      sellerId: "seller1",
      category: "electronics",
      location: { lat: -4.3217, lng: 15.3069 },
      discount: 18,
      isPopular: true,
      isAvailable: true,
      condition: "new" as const,
      tags: ["samsung", "smartphone", "android"]
    },
    {
      id: "2",
      name: "Robe Africaine Premium",
      price: 85000,
      image: "/placeholder.svg",
      rating: 4.9,
      reviewCount: 32,
      seller: "Mode Africaine",
      sellerId: "seller2",
      category: "fashion",
      location: { lat: -11.6609, lng: 27.4794 },
      isNew: true,
      isAvailable: true,
      condition: "new" as const,
      tags: ["robe", "africaine", "mode", "fashion"]
    },
    {
      id: "3",
      name: "Riz Jasmin 25kg",
      price: 45000,
      originalPrice: 50000,
      image: "/placeholder.svg",
      rating: 4.7,
      reviewCount: 128,
      seller: "Alimentation Tembea",
      sellerId: "seller3",
      category: "food",
      location: { lat: -4.3317, lng: 15.3169 },
      discount: 10,
      isAvailable: true,
      condition: "new" as const,
      tags: ["riz", "jasmin", "alimentation", "cereales"]
    },
    {
      id: "4",
      name: "MacBook Air M2",
      price: 1200000,
      image: "/placeholder.svg",
      rating: 5.0,
      reviewCount: 15,
      seller: "Premium Tech",
      sellerId: "seller4",
      category: "electronics",
      location: { lat: -4.3117, lng: 15.2969 },
      isPremium: true,
      isAvailable: true,
      condition: "new" as const,
      tags: ["macbook", "apple", "laptop", "ordinateur"]
    },
    {
      id: "5",
      name: "Chaussures Nike Air Max",
      price: 120000,
      originalPrice: 150000,
      image: "/placeholder.svg",
      rating: 4.6,
      reviewCount: 67,
      seller: "Sports Shop",
      sellerId: "seller5",
      category: "fashion",
      location: { lat: -10.7062, lng: 25.4731 },
      discount: 20,
      isAvailable: true,
      condition: "new" as const,
      tags: ["nike", "air max", "chaussures", "sport"]
    },
    {
      id: "6",
      name: "Set Maquillage Professionnel",
      price: 75000,
      image: "/placeholder.svg",
      rating: 4.8,
      reviewCount: 89,
      seller: "Beauty Palace",
      sellerId: "seller6",
      category: "beauty",
      location: { lat: -11.6509, lng: 27.4694 },
      isPopular: true,
      isAvailable: true,
      condition: "new" as const,
      tags: ["maquillage", "beaute", "cosmetic", "makeup"]
    }
  ];

  const topSellers = [
    { name: "TechStore Kinshasa", rating: 4.9, sales: 1200, verified: true },
    { name: "Mode Africaine", rating: 4.8, sales: 850, verified: true },
    { name: "Alimentation Tembea", rating: 4.7, sales: 2100, verified: true },
    { name: "Premium Tech", rating: 5.0, sales: 340, verified: true }
  ];

  const cities = ["Kinshasa", "Lubumbashi", "Kolwezi"];

  // Initialize filters with user location and favorites
  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : undefined;
  const favoriteIds = favoriteItems.map(item => item.id);

  const {
    filters,
    filteredProducts,
    updateFilter,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    applyQuickFilter,
    filterStats,
  } = useMarketplaceFilters({
    products: featuredProducts,
    userLocation,
    favoriteIds,
  });

  const handleAddToCart = (product: any) => {
    addToCart(product);
  };

  const handleViewDetails = (product: any) => {
    // Navigate to product detail page
    console.log('View product details:', product);
  };

  const handleViewSeller = (sellerId: string) => {
    // Navigate to seller profile
    console.log('View seller:', sellerId);
  };

  const handleCheckout = () => {
    setShowCart(false);
    // Navigate to checkout
    console.log('Proceed to checkout');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Modern Header with Search and Location */}
        <MarketplaceHeader
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => updateFilter('searchQuery', query)}
          onFilterClick={() => setShowFilters(true)}
          onCartClick={() => setShowCart(true)}
          onFavoritesClick={() => setShowFavorites(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl text-center relative z-10">
            <Badge variant="outline" className="border-white/30 text-white mb-6">
              🛍️ Tembea Shop
            </Badge>
            <h1 className="text-display-lg mb-6">
              Marketplace
              <br />
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Congo RDC
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Découvrez les meilleurs produits du Congo avec livraison rapide dans les 3 grandes villes. 
              Achetez local, supportez l'économie congolaise !
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Parcourir les Produits
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Store className="w-5 h-5 mr-2" />
                Devenir Vendeur
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 px-4 border-b">
          <div className="container mx-auto max-w-7xl">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={filters.selectedCategory === category.id ? "default" : "outline"}
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => updateFilter('selectedCategory', category.id)}
                >
                  {category.icon}
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                  Produits Populaires
                </h2>
                <p className="text-muted-foreground mt-2">
                  {filterStats.filteredCount} produits trouvés
                  {hasActiveFilters && ` (sur ${filterStats.totalProducts} au total)`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(true)}
                  className="relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      !
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <CompactProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                  onViewSeller={handleViewSeller}
                  userLocation={userLocation}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-6">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Réinitialiser les filtres
                </Button>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="text-center mt-12">
                <Button size="lg" variant="outline" className="group">
                  Voir Plus de Produits
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Top Sellers */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-display-md text-center mb-16 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
              Vendeurs de Confiance
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {topSellers.map((seller, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                      {seller.name.charAt(0)}
                    </div>
                    
                    <h3 className="text-heading-sm mb-2 flex items-center justify-center gap-2">
                      {seller.name}
                      {seller.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{seller.rating}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {seller.sales.toLocaleString()} ventes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4">Livraison dans 3 Villes</h2>
              <p className="text-body-lg text-muted-foreground">
                Commandez depuis n'importe où, nous livrons dans les principales villes du Congo
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {cities.map((city, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-heading-lg mb-4">{city}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Livraison rapide
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Paiement sécurisé
                      </div>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                      Explorer {city}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-display-md mb-6">Vendez vos Produits sur Tembea Shop</h2>
            <p className="text-xl mb-8 text-white/90">
              Rejoignez plus de 200 vendeurs qui font confiance à Tembea pour développer leur business. 
              Commission de seulement 8% avec livraison intégrée !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/partners/vendre-en-ligne">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Store className="w-5 h-5 mr-2" />
                  Devenir Vendeur
                </Button>
              </Link>
              <Link to="/support/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  En Savoir Plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ModernFooter />

        {/* Modals */}
        <AdvancedFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          onApplyQuickFilter={applyQuickFilter}
          hasActiveFilters={hasActiveFilters}
          filterStats={filterStats}
        />

        <UnifiedShoppingCart
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          userCoordinates={userLocation}
        />
      </div>
    </PageTransition>
  );
};

const Marketplace = () => {
  return <MarketplaceContent />;
};

export default Marketplace;