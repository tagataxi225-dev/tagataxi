import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Camera, Package, DollarSign, CheckCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const VendorProductWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: 'electronics',
    condition: 'new'
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 photos autorisées');
      return;
    }
    
    setImages([...images, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      try {
        const fileName = `${user.id}/${Date.now()}-${image.name}`;
        const { data, error } = await supabase.storage
          .from('marketplace-products')
          .upload(fileName, image);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('marketplace-products')
          .getPublicUrl(data.path);
        
        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (step === 1) {
      if (!productData.title || !productData.description) {
        toast.error('Veuillez remplir tous les champs requis');
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      if (images.length < 3) {
        toast.error('Minimum 3 photos requises');
        return;
      }
      setStep(3);
      return;
    }
    
    if (step === 3) {
      if (!productData.price || !productData.stock) {
        toast.error('Veuillez définir le prix et le stock');
        return;
      }
      
      setUploading(true);
      try {
        // Upload images
        const imageUrls = await uploadImages();
        
        if (imageUrls.length === 0) {
          toast.error('Erreur lors du téléchargement des images');
          return;
        }
        
        // Create product
        const { error } = await supabase
          .from('marketplace_products')
          .insert({
            seller_id: user?.id,
            title: productData.title,
            description: productData.description,
            price: parseFloat(productData.price),
            stock_count: parseInt(productData.stock),
            images: imageUrls,
            category: productData.category,
            condition: productData.condition,
            moderation_status: 'pending',
            status: 'inactive'
          });
        
        if (error) throw error;
        
        toast.success(
          'Produit créé avec succès !',
          { description: 'Votre produit sera modéré sous 24h. Vous serez notifié par email.' }
        );
        
        navigate('/vendor');
      } catch (error) {
        console.error('Product creation error:', error);
        toast.error('Erreur lors de la création du produit');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Ajouter votre premier produit</CardTitle>
          <Progress value={progress} className="mt-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {step} sur {totalSteps}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Étape 1: Informations de base */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Package className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Détails du produit</h3>
                <p className="text-sm text-muted-foreground">
                  Décrivez votre produit de manière claire et précise
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Nom du produit *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: iPhone 13 Pro Max 256GB"
                    value={productData.title}
                    onChange={(e) => setProductData({ ...productData, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre produit en détail (état, caractéristiques, etc.)"
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border rounded-md"
                      value={productData.category}
                      onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                    >
                      <option value="electronics">Électronique</option>
                      <option value="fashion">Mode</option>
                      <option value="home">Maison</option>
                      <option value="beauty">Beauté</option>
                      <option value="sports">Sport</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition">État</Label>
                    <select
                      id="condition"
                      className="w-full px-3 py-2 border rounded-md"
                      value={productData.condition}
                      onChange={(e) => setProductData({ ...productData, condition: e.target.value })}
                    >
                      <option value="new">Neuf</option>
                      <option value="like_new">Comme neuf</option>
                      <option value="good">Bon état</option>
                      <option value="fair">État correct</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Photos du produit</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez au moins 3 photos de qualité (max 5)
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="product-images"
                    />
                    <Label htmlFor="product-images" className="cursor-pointer text-center">
                      <Camera className="w-8 h-8 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Ajouter</p>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 3: Prix et stock */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Prix et disponibilité</h3>
                <p className="text-sm text-muted-foreground">
                  Définissez le prix et la quantité disponible
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="price">Prix (CDF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="50000"
                    value={productData.price}
                    onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="stock">Quantité en stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="10"
                    value={productData.stock}
                    onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Modération automatique</h4>
                  <p className="text-sm text-blue-700">
                    Votre produit sera vérifié par notre équipe sous 24h. Vous recevrez une notification par email une fois approuvé.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Retour
              </Button>
            )}
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : step === totalSteps ? (
                'Publier le produit'
              ) : (
                'Continuer'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
