import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShareMetaTags } from '@/components/seo/ShareMetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Clock, MapPin, Phone, ChefHat, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRestaurantUrl } from '@/config/appUrl';
import type { Restaurant, FoodProduct } from '@/types/food';

export default function RestaurantPublicPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      console.log('[RestaurantPublicPage] Opening shared restaurant:', {
        restaurantId,
        isAuthenticated: !!user,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      if (!restaurantId) return;

      // Charger le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .in('verification_status', ['approved', 'pending'])
        .single();

      if (restaurantError) throw restaurantError;
      if (!restaurantData) {
        toast({
          title: 'Restaurant introuvable',
          description: 'Ce restaurant n\'existe pas ou n\'est plus actif.',
          variant: 'destructive'
        });
        navigate('/food');
        return;
      }

      setRestaurant(restaurantData as Restaurant);

      // Charger le menu
      const { data: menuData, error: menuError } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('category', { ascending: true });

      if (menuError) throw menuError;
      setMenu((menuData || []) as FoodProduct[]);

    } catch (error: any) {
      console.error('[RestaurantPublicPage] Error loading restaurant:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le restaurant.',
        variant: 'destructive'
      });
      navigate('/food');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = () => {
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour commander.',
        action: <Button onClick={() => navigate('/auth')}>Se connecter</Button>
      });
      return;
    }
    // Rediriger vers la page de commande normale
    navigate(`/food?restaurant=${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const restaurantUrl = getRestaurantUrl(restaurant.id);

  // Grouper les plats par catégorie
  const menuByCategory = menu.reduce((acc, product) => {
    const category = product.category || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, FoodProduct[]>);

  return (
    <>
      <ShareMetaTags
        title={`${restaurant.restaurant_name} | TAGA Food`}
        description={`Découvre le menu de ${restaurant.restaurant_name} sur TAGA Food. ${menu.length} plats disponibles. Note ${restaurant.rating_average?.toFixed(1) || 0}/5`}
        image={restaurant.logo_url || restaurant.banner_url}
        url={restaurantUrl}
      />

      <div className="min-h-screen bg-background">
        {/* Header avec banner */}
        <div className="relative">
          {restaurant.banner_url && (
            <div 
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${restaurant.banner_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/90 hover:bg-white text-foreground"
              onClick={() => navigate('/food')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Restaurant info */}
          <div className="relative max-w-4xl mx-auto px-4 -mt-16">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {restaurant.logo_url && (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.restaurant_name}
                      className="w-20 h-20 rounded-lg object-cover border-4 border-background"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{restaurant.restaurant_name}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {restaurant.description}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {restaurant.rating_average?.toFixed(1) || '0.0'} ({restaurant.rating_count || 0} avis)
                      </Badge>
                      
                      {restaurant.average_preparation_time && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {restaurant.average_preparation_time} min
                        </Badge>
                      )}
                      
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {restaurant.city}
                      </Badge>
                    </div>

                    {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {restaurant.cuisine_types.map((cuisine, idx) => (
                          <Badge key={idx} variant="secondary">
                            <ChefHat className="h-3 w-3 mr-1" />
                            {cuisine}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {!user && (
                  <Card className="border-primary/20 bg-primary/5 mb-4">
                    <CardContent className="pt-6">
                      <p className="text-center text-sm text-muted-foreground mb-3">
                        Créez un compte gratuit pour commander
                      </p>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => navigate('/auth')}
                      >
                        Se connecter / S'inscrire
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Menu */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Menu</h2>
          
          {menu.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun plat disponible pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(menuByCategory).map(([category, products]) => (
                <div key={category}>
                  <h3 className="text-xl font-semibold mb-4">{category}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="flex">
                          {product.main_image_url && (
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="w-24 h-24 object-cover"
                            />
                          )}
                          <div className="flex-1 p-4">
                            <h4 className="font-semibold">{product.name}</h4>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <p className="text-lg font-bold text-primary mt-2">
                              {product.price.toLocaleString()} FC
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Commander */}
          {menu.length > 0 && (
            <Card className="mt-8 border-primary">
              <CardContent className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">Prêt à commander ?</h3>
                <p className="text-muted-foreground mb-4">
                  {user 
                    ? 'Cliquez ci-dessous pour passer votre commande'
                    : 'Créez un compte gratuit pour commander'
                  }
                </p>
                <Button
                  size="lg"
                  className="w-full max-w-md"
                  onClick={handleOrderClick}
                >
                  {user ? 'Commander maintenant' : 'Créer un compte et commander'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
