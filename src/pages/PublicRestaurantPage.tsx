import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, Phone, Share2, ShoppingCart } from 'lucide-react';
import type { Restaurant, FoodProduct } from '@/types/food';

export default function PublicRestaurantPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<FoodProduct[]>([]);

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      // Charger le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData as Restaurant);

      // Charger les produits approuvés
      const { data: productsData, error: productsError } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('category', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData as FoodProduct[]);
    } catch (error) {
      console.error('Error loading restaurant:', error);
      toast({
        title: 'Erreur',
        description: 'Restaurant introuvable',
        variant: 'destructive',
      });
      navigate('/food');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: restaurant?.restaurant_name,
      text: `Découvrez ${restaurant?.restaurant_name} sur Tembea Food`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Lien copié',
        description: 'Le lien a été copié dans le presse-papier',
      });
    }
  };

  const handleOrderClick = () => {
    navigate(`/food?restaurant=${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, FoodProduct[]>);

  return (
    <>
      <Helmet>
        <title>{restaurant.restaurant_name} - Tembea Food</title>
        <meta name="description" content={restaurant.description || `Découvrez le menu de ${restaurant.restaurant_name}`} />
        <meta property="og:title" content={`${restaurant.restaurant_name} - Tembea Food`} />
        <meta property="og:description" content={restaurant.description || ''} />
        <meta property="og:image" content={restaurant.banner_url || restaurant.logo_url || ''} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header avec image de couverture */}
        <div className="relative h-64 bg-gradient-to-br from-orange-500 to-red-500">
          {restaurant.banner_url && (
            <img
              src={restaurant.banner_url}
              alt={restaurant.restaurant_name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Navigation */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Infos restaurant */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-end gap-4">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.restaurant_name}
                  className="w-20 h-20 rounded-xl border-4 border-white shadow-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{restaurant.restaurant_name}</h1>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{restaurant.rating_average?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span>•</span>
                  <span>{restaurant.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          {/* Infos restaurant */}
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {restaurant.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    </div>
                  </div>
                )}
                
                {restaurant.phone_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-sm text-muted-foreground">{restaurant.phone_number}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Horaires</p>
                    <p className="text-sm text-muted-foreground">
                      Voir avec le restaurant
                    </p>
                  </div>
                </div>
              </div>

              {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {restaurant.cuisine_types.map((cuisine, index) => (
                    <Badge key={index} variant="secondary">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu par catégorie */}
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      {product.main_image_url && (
                        <div className="aspect-video relative">
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-primary">
                            {product.price.toLocaleString()} FC
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Menu en cours de préparation</p>
                <p className="text-sm text-muted-foreground">Revenez bientôt !</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bouton flottant Commander */}
        {products.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-auto">
            <Button
              size="lg"
              className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
              onClick={handleOrderClick}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Commander maintenant
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
