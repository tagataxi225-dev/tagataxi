import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Camera, Upload, X, ArrowLeft, Tag, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminCreateProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  status: string;
  featured: boolean;
  tags: string;
  stockCount: string;
  images: File[];
}

interface AdminCreateProductFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const categories = [
  { id: 'electronics', name: 'Électronique' },
  { id: 'fashion', name: 'Mode & Vêtements' },
  { id: 'home', name: 'Maison & Jardin' },
  { id: 'food', name: 'Alimentation' },
  { id: 'beauty', name: 'Beauté & Cosmétiques' },
  { id: 'sports', name: 'Sports & Loisirs' },
  { id: 'books', name: 'Livres & Éducation' },
  { id: 'automotive', name: 'Automobile' },
  { id: 'other', name: 'Autre' }
];

const conditions = [
  { id: 'new', name: 'Neuf' },
  { id: 'like-new', name: 'Comme neuf' },
  { id: 'good', name: 'Bon état' },
  { id: 'fair', name: 'État correct' },
  { id: 'poor', name: 'Usagé' }
];

const statuses = [
  { id: 'active', name: 'Actif' },
  { id: 'inactive', name: 'Inactif' }
];

export const AdminCreateProductForm: React.FC<AdminCreateProductFormProps> = ({ onBack, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<AdminCreateProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new',
    status: 'active',
    featured: false,
    tags: '',
    stockCount: '1',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof AdminCreateProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 10 - formData.images.length);
    
    newFiles.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Les images doivent faire moins de 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté en tant qu'admin",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      for (const file of formData.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `admin-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        imageUrls.push(urlData.publicUrl);
      }

      // Create product in database
      const { error } = await supabase
        .from('marketplace_products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          status: formData.status,
          moderation_status: 'approved', // Admin products are auto-approved
          featured: formData.featured,
          images: imageUrls,
          seller_id: user.id,
          coordinates: null,
          location: 'Marketplace Officiel'
        });

      if (error) throw error;

      toast({
        title: 'Produit créé',
        description: 'Le produit a été créé avec succès par l\'admin',
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du produit",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Créer un produit (Admin)</h1>
            <p className="text-sm text-muted-foreground">Ajouter un nouveau produit au marketplace</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photos du produit
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ajoutez jusqu'à 10 photos (max 10MB chacune)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && (
                    <Badge className="absolute bottom-2 left-2 text-xs bg-primary text-white">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
              
              {formData.images.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground text-center">Ajouter photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détails du produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du produit *</Label>
              <Input
                id="title"
                placeholder="Ex: iPhone 15 Pro Max 256GB Officiel"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/150 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Description détaillée du produit, caractéristiques techniques, garanties..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/1000 caractères
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">État</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="État du produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(condition => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (CDF) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Ex: 850000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="stockCount">Stock disponible</Label>
                <Input
                  id="stockCount"
                  type="number"
                  placeholder="Ex: 10"
                  value={formData.stockCount}
                  onChange={(e) => handleInputChange('stockCount', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                placeholder="Ex: smartphone, apple, garantie, livraison"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Paramètres administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Statut de publication</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit mis en avant</Label>
                <p className="text-sm text-muted-foreground">
                  Afficher ce produit en premier dans les résultats
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </div>
  );
};