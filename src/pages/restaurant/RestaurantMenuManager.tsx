import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon, Percent, Video } from 'lucide-react';
import { ProductImageUpload } from '@/components/restaurant/ProductImageUpload';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  is_available: boolean;
  moderation_status: string;
  main_image_url: string | null;
  preparation_time: number | null;
  video_url: string | null;
}

export default function RestaurantMenuManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'plats',
    price: '',
    preparation_time: '15',
    main_image_url: '',
    is_available: true,
    is_promo: false,
    discount_percentage: '10',
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await loadProducts();
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadProducts();
    }
  }, [restaurantId]);

  const loadRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    }
  };

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Nom du plat
    if (!formData.name.trim()) {
      errors.push('Le nom du plat est obligatoire');
    } else if (formData.name.length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    } else if (formData.name.length > 100) {
      errors.push('Le nom ne doit pas dépasser 100 caractères');
    }
    
    // Catégorie
    if (!formData.category) {
      errors.push('Veuillez sélectionner une catégorie');
    }
    
    // Prix
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.push('Le prix est obligatoire');
    } else if (price <= 0) {
      errors.push('Le prix doit être supérieur à 0 CDF');
    } else if (price > 1000000) {
      errors.push('Le prix ne peut pas dépasser 1.000.000 CDF');
    }
    
    // Temps de préparation
    const prepTime = parseInt(formData.preparation_time);
    if (prepTime < 5) {
      errors.push('Le temps de préparation doit être d\'au moins 5 minutes');
    } else if (prepTime > 180) {
      errors.push('Le temps de préparation ne peut pas dépasser 180 minutes');
    }
    
    // Images (recommandé mais pas obligatoire)
    if (productImages.length === 0) {
      errors.push('⚠️ Recommandation : Ajoutez au moins une photo pour augmenter vos ventes');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const handleSaveProduct = async () => {
    if (!restaurantId) return;

    // Validation
    const validation = validateForm();
    if (!validation.valid) {
      validation.errors.forEach(error => {
        toast({
          title: 'Validation échouée',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }

    try {
      setSaving(true);

      console.log('📝 [MenuManager] Saving product:', {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        images: productImages.length
      });

      const basePrice = parseFloat(formData.price);
      const isPromo = formData.is_promo;
      const discountPct = isPromo ? parseInt(formData.discount_percentage) : 0;
      const finalPrice = isPromo ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;

      // Upload vidéo si présente
      let videoUrl: string | null = null;
      if (videoFile) {
        const { data: { user } } = await supabase.auth.getUser();
        const videoExt = videoFile.name.split('.').pop();
        const videoFileName = `food-videos/${user!.id}/${Date.now()}.${videoExt}`;
        const { error: vErr } = await supabase.storage
          .from('product-images')
          .upload(videoFileName, videoFile, { cacheControl: '3600', upsert: false });
        if (!vErr) {
          const { data: vUrl } = supabase.storage.from('product-images').getPublicUrl(videoFileName);
          videoUrl = vUrl.publicUrl;
        }
      }

      const productData = {
        restaurant_id: restaurantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        price: finalPrice,
        original_price: isPromo ? basePrice : null,
        discount_percentage: discountPct,
        preparation_time: parseInt(formData.preparation_time),
        main_image_url: productImages[0] || null,
        images: productImages,
        is_available: formData.is_available,
        moderation_status: 'pending',
        video_url: videoUrl || (editingProduct?.video_url ?? null),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('food_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }

        toast({
          title: '✅ Plat mis à jour',
          description: 'En attente de validation par l\'équipe Tembea',
        });
      } else {
        const { data, error } = await supabase
          .from('food_products')
          .insert(productData)
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }

        console.log('✅ Product created:', data);

        toast({
          title: '✅ Plat ajouté avec succès',
          description: 'Il sera visible après validation (environ 24h)',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadProducts();
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      let errorMessage = 'Impossible de sauvegarder le plat';
      
      // Messages d'erreur détaillés
      if (error.code === '23505') {
        errorMessage = 'Un plat avec ce nom existe déjà';
      } else if (error.code === '23503') {
        errorMessage = 'Erreur de référence (restaurant_id invalide)';
      } else if (error.code === '42501') {
        errorMessage = 'Permissions insuffisantes. Contactez le support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erreur de sauvegarde',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    const hasPromo = (product.discount_percentage || 0) > 0;
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: hasPromo ? (product.original_price || product.price).toString() : product.price.toString(),
      preparation_time: product.preparation_time?.toString() || '15',
      main_image_url: product.main_image_url || '',
      is_available: product.is_available,
      is_promo: hasPromo,
      discount_percentage: (product.discount_percentage || 10).toString(),
    });
    setVideoFile(null);
    setVideoPreviewUrl(product.video_url || null);
    // Charger les images existantes depuis la base
    setProductImages(product.main_image_url ? [product.main_image_url] : []);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Supprimer ce plat ?')) return;

    try {
      const { error } = await supabase
        .from('food_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Plat supprimé',
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'plats',
      price: '',
      preparation_time: '15',
      main_image_url: '',
      is_available: true,
      is_promo: false,
      discount_percentage: '10',
    });
    setProductImages([]);
    setEditingProduct(null);
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  const getModerationBadge = (status: string) => {
    const variants: any = {
      pending: { label: 'En attente', variant: 'secondary' },
      approved: { label: 'Approuvé', variant: 'default' },
      rejected: { label: 'Rejeté', variant: 'destructive' },
    };
    const { label, variant } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // handleRefresh moved to top with other hooks

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading || !restaurantId}>
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion du Menu</h1>
            <p className="text-muted-foreground">Ajoutez et gérez vos plats</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau plat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[90vh] sm:h-[95vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogTitle>
                  {editingProduct ? 'Modifier le plat' : 'Nouveau plat'}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="space-y-4 px-6 py-4">
                  <div>
                    <Label>Nom du plat *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Poulet Moambé"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimum 3 caractères</span>
                      <span className={cn(
                        formData.name.length >= 100 && "text-destructive font-medium"
                      )}>
                        {formData.name.length}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez votre plat..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Catégorie *</Label>
                    <RadioGroup 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      className="grid grid-cols-2 gap-3"
                    >
                      {FOOD_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <div key={cat.id}>
                            <RadioGroupItem
                              value={cat.id}
                              id={cat.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={cat.id}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all",
                                formData.category === cat.id && "border-primary bg-primary/10"
                              )}
                            >
                              <Icon className="h-6 w-6 mb-2" />
                              <span className="text-sm font-medium">{cat.name}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Prix (CDF) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="5000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 1.000.000 CDF
                    </p>
                  </div>

                  <div>
                    <Label>Temps de préparation (min)</Label>
                    <Input
                      type="number"
                      value={formData.preparation_time}
                      onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                      placeholder="15"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Entre 5 et 180 minutes
                    </p>
                  </div>

                  <div>
                    <Label>Photos du produit</Label>
                    <ProductImageUpload
                      restaurantId={restaurantId || ''}
                      currentImages={productImages}
                      onImagesChange={setProductImages}
                      maxImages={5}
                    />
                  </div>

                  {/* Vidéo explicative */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Vidéo courte (optionnelle)
                    </Label>
                    {videoPreviewUrl ? (
                      <div className="relative mt-2 rounded-xl overflow-hidden bg-muted">
                        <video src={videoPreviewUrl} className="w-full h-32 object-cover" muted playsInline controls />
                        <button
                          className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 hover:scale-110 transition-transform z-10"
                          onClick={() => {
                            if (videoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(videoPreviewUrl);
                            setVideoPreviewUrl(null);
                            setVideoFile(null);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="mt-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('food-video-upload')?.click()}
                      >
                        <Video className="w-8 h-8 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Max 15s • Max 10MB • MP4/WebM</p>
                      </div>
                    )}
                    <input
                      id="food-video-upload"
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          toast({ title: "Vidéo trop lourde", description: "Maximum 10MB", variant: "destructive" });
                          return;
                        }
                        const videoEl = document.createElement('video');
                        videoEl.preload = 'metadata';
                        videoEl.onloadedmetadata = () => {
                          URL.revokeObjectURL(videoEl.src);
                          if (videoEl.duration > 15) {
                            toast({ title: "Vidéo trop longue", description: "Maximum 15 secondes", variant: "destructive" });
                            return;
                          }
                          setVideoFile(file);
                          setVideoPreviewUrl(URL.createObjectURL(file));
                        };
                        videoEl.src = URL.createObjectURL(file);
                      }}
                    />
                  </div>

                  {/* Section Promotion */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-destructive" />
                        <Label className="font-semibold">Mettre en promotion</Label>
                      </div>
                      <Switch
                        checked={formData.is_promo}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_promo: checked })}
                      />
                    </div>
                    
                    {formData.is_promo && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label>Réduction (%)</Label>
                          <Input
                            type="number"
                            min="5"
                            max="80"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Entre 5% et 80%</p>
                        </div>
                        
                        {formData.price && formData.discount_percentage && (
                          <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                            <p className="text-muted-foreground">
                              Prix normal : <span className="line-through">{parseFloat(formData.price).toLocaleString()} CDF</span>
                            </p>
                            <p className="text-foreground font-bold text-base">
                              Prix promo : {Math.round(parseFloat(formData.price) * (1 - parseInt(formData.discount_percentage) / 100)).toLocaleString()} CDF
                              <span className="text-destructive ml-2 text-sm font-semibold">-{formData.discount_percentage}%</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Disponible</Label>
                    <Switch
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                  </div>
                </div>
              </ScrollArea>

              {/* Footer avec bouton fixe */}
              <div className="flex-shrink-0 border-t px-6 py-4 bg-background">
                <Button
                  className="w-full"
                  onClick={handleSaveProduct}
                  disabled={saving || !formData.name || !formData.price}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Mettre à jour' : 'Ajouter le plat'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {/* Image ou placeholder */}
              {product.main_image_url ? (
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-muted/30 flex items-center justify-center">
                  <div className="p-4 rounded-full bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  {getModerationBadge(product.moderation_status)}
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {(product.discount_percentage || 0) > 0 && product.original_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">{product.original_price.toLocaleString()} CDF</span>
                        <span className="text-lg font-bold text-destructive">{product.price.toLocaleString()} CDF</span>
                        <Badge variant="destructive" className="text-[10px] px-1.5">-{product.discount_percentage}%</Badge>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">{product.price.toLocaleString()} CDF</span>
                    )}
                  </div>
                  <Badge variant={product.is_available ? 'default' : 'secondary'}>
                    {product.is_available ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProduct(product)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun plat ajouté</p>
              <p className="text-sm text-muted-foreground">Commencez par ajouter votre premier plat</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PullToRefresh>
  );
}
