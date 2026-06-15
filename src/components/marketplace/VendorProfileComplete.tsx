import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Heart, Bell, BellOff, Store, Calendar, MapPin, Phone, Mail, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  business_name?: string;
  business_address?: string;
  rating_average?: number;
  rating_count?: number;
  total_products?: number;
  total_sales?: number;
  member_since?: string;
  is_verified?: boolean;
}

interface VendorProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  is_available: boolean;
  created_at: string;
}

interface VendorProfileCompleteProps {
  vendorId: string;
  onClose: () => void;
  currentUserId?: string;
}

export const VendorProfileComplete: React.FC<VendorProfileCompleteProps> = ({
  vendorId,
  onClose,
  currentUserId
}) => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const fetchVendorProfile = async () => {
    try {
      // Récupérer le profil vendeur depuis les clients/profiles
      const { data: profile, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (error) throw error;

      // Calculer les statistiques
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', vendorId);

      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('seller_id', vendorId)
        .eq('status', 'completed');

      const totalSales = orders?.length || 0;
      const avgRating = 4.5; // Note par défaut

      setVendor({
        id: profile.user_id,
        name: profile.display_name,
        email: profile.email,
        phone: profile.phone_number,
        bio: profile.address || 'Aucune description disponible',
        business_address: profile.city || 'Kinshasa',
        rating_average: avgRating,
        rating_count: products?.length || 0,
        total_products: products?.length || 0,
        total_sales: totalSales,
        member_since: profile.created_at,
        is_verified: true
      });

      // Transformer les produits pour correspondre à l'interface
      const transformedProducts: VendorProduct[] = products?.map(p => ({
        id: p.id,
        name: p.title || 'Produit sans nom',
        price: p.price,
        image: typeof p.images === 'string' ? p.images : (Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined),
        category: p.category,
        is_available: p.moderation_status === 'approved',
        created_at: p.created_at
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Erreur lors du chargement du profil vendeur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil du vendeur",
        variant: "destructive"
      });
    }
  };

  const checkSubscription = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('customer_id', currentUserId)
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
    }
  };

  const toggleSubscription = async () => {
    if (!currentUserId) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour vous abonner",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubscribing(true);

      if (isSubscribed) {
        // Désabonnement
        const { error } = await supabase
          .from('vendor_subscriptions')
          .update({ is_active: false })
          .eq('customer_id', currentUserId)
          .eq('vendor_id', vendorId);

        if (error) throw error;

        setIsSubscribed(false);
        toast({
          title: "Désabonnement réussi",
          description: "Vous ne recevrez plus de notifications de ce vendeur"
        });
      } else {
        // Abonnement
        const { error } = await supabase
          .from('vendor_subscriptions')
          .upsert({
            customer_id: currentUserId,
            vendor_id: vendorId,
            is_active: true,
            notification_preferences: {
              new_products: true,
              promotions: true,
              price_drops: true
            }
          });

        if (error) throw error;

        setIsSubscribed(true);
        toast({
          title: "Abonnement réussi",
          description: "Vous recevrez désormais les notifications de ce vendeur"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'abonnement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'abonnement",
        variant: "destructive"
      });
    } finally {
      setSubscribing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount).replace('CDF', 'CDF');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVendorProfile(), checkSubscription()]);
      setLoading(false);
    };

    loadData();
  }, [vendorId, currentUserId]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Vendeur non trouvé</p>
        <Button onClick={onClose} className="mt-4">Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec profil vendeur */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={vendor.avatar_url} alt={vendor.name} />
              <AvatarFallback className="text-xl">
                {vendor.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <span>{vendor.name}</span>
                    {vendor.is_verified && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        <Trophy className="mr-1 h-3 w-3" />
                        Vérifié
                      </Badge>
                    )}
                  </h1>
                  <div className="flex items-center space-x-1 mt-1">
                    {renderStars(vendor.rating_average || 0)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({vendor.rating_count} avis)
                    </span>
                  </div>
                </div>
                
                {currentUserId && currentUserId !== vendorId && (
                  <Button
                    onClick={toggleSubscription}
                    disabled={subscribing}
                    variant={isSubscribed ? "outline" : "default"}
                    className="flex items-center space-x-2"
                  >
                    {isSubscribed ? (
                      <>
                        <BellOff className="h-4 w-4" />
                        <span>Se désabonner</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        <span>S'abonner</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <p className="text-muted-foreground">{vendor.bio}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{vendor.total_products}</p>
                  <p className="text-sm text-muted-foreground">Produits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{vendor.total_sales}</p>
                  <p className="text-sm text-muted-foreground">Ventes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{vendor.rating_average?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {vendor.member_since ? new Date(vendor.member_since).getFullYear() : new Date().getFullYear()}
                  </p>
                  <p className="text-sm text-muted-foreground">Membre depuis</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="h-5 w-5" />
            <span>Informations de contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.email}</span>
          </div>
          {vendor.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.phone}</span>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.business_address}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Membre depuis {vendor.member_since ? new Date(vendor.member_since).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Produits du vendeur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Produits ({products.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun produit disponible pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {!product.is_available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Indisponible</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatAmount(product.price)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onClose} variant="outline">
          Retour
        </Button>
        {isSubscribed && (
          <Badge variant="default" className="px-3 py-1">
            <Heart className="mr-1 h-3 w-3" />
            Abonné aux notifications
          </Badge>
        )}
      </div>
    </div>
  );
};