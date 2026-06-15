import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Camera, Upload, X, ArrowLeft, Save, Tag, FileText, 
  DollarSign, Package, ToggleLeft, Layers, ImagePlus, Sparkles, CheckCircle2,
  Video, Trash2
} from 'lucide-react';
import { premiumNotify } from '@/components/notifications/PremiumNotificationContainer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

interface EditProductFormData {
  id: string;
  title: string;
  description: string;
  price: string;
  stock_count: string;
  category: string;
  condition: string;
  status: string;
  images: (File | string)[];
}

interface EditProductFormProps {
  product: any;
  onBack: () => void;
  onUpdate: () => void;
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
  { id: 'inactive', name: 'Inactif' },
  { id: 'sold', name: 'Vendu' }
];

const isValidProductImage = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  const placeholderPatterns = ['placehold.co', 'placeholder', 'via.placeholder', '300x300'];
  return !placeholderPatterns.some(pattern => url.toLowerCase().includes(pattern));
};

const getModerationBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return { label: 'Approuvé', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'pending':
      return { label: 'En attente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    case 'rejected':
      return { label: 'Rejeté', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    default:
      return { label: 'Brouillon', className: 'bg-muted text-muted-foreground border-border' };
  }
};

export const EditProductForm: React.FC<EditProductFormProps> = ({ product, onBack, onUpdate }) => {
  
  const { user } = useAuth();
  const [formData, setFormData] = useState<EditProductFormData>({
    id: product.id,
    title: product.title || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    stock_count: product.stock_count?.toString() || '1',
    category: product.category || '',
    condition: product.condition || '',
    status: product.status || 'active',
    images: Array.isArray(product.images) ? product.images.filter(img => typeof img === 'string' && isValidProductImage(img)) : []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(product.video_url || null);

  const moderationBadge = getModerationBadge(product.moderation_status);

  useEffect(() => {
    if (Array.isArray(product.images)) {
      const validImages = product.images.filter(
        (img: any) => typeof img === 'string' && isValidProductImage(img)
      );
      setImagePreviews(validImages);
      setFormData(prev => ({ ...prev, images: validImages }));
    }
  }, [product]);

  // ... keep existing code (handleInputChange, handleImageUpload, removeImage, handleSubmit - all business logic unchanged)
  const handleInputChange = (field: keyof EditProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - formData.images.length);
    
    newFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        premiumNotify.error("Fichier trop volumineux", "Les images doivent faire moins de 5MB");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setImagePreviews(prev => [...prev, objectUrl]);
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
  };

  const removeImage = (index: number) => {
    const urlToRevoke = imagePreviews[index];
    if (urlToRevoke?.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      premiumNotify.error("Vidéo trop volumineuse", "La vidéo doit faire moins de 10MB");
      return;
    }

    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      premiumNotify.error("Format non supporté", "Formats acceptés : MP4, WebM");
      return;
    }

    // Validate duration (max 15s)
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      if (videoEl.duration > 15) {
        premiumNotify.error("Vidéo trop longue", "La durée maximale est de 15 secondes");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (videoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(file);
      setVideoPreviewUrl(previewUrl);
    };
    videoEl.src = URL.createObjectURL(file);
  };

  const removeVideo = () => {
    if (videoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      premiumNotify.warning("Champs requis manquants", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrls: string[] = [];
      
      for (const image of formData.images) {
        if (typeof image === 'string') {
          imageUrls.push(image);
        } else {
          let fileToUpload: File | Blob = image;
          if (image.size > 1 * 1024 * 1024) {
            try {
              fileToUpload = await imageCompression(image, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
              });
            } catch (compressionError) {
              console.warn('Compression failed, using original:', compressionError);
            }
          }

          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `${user?.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          imageUrls.push(urlData.publicUrl);
        }
      }

      // ── Video upload ──
      let videoUrl: string | null = videoPreviewUrl;
      if (videoFile) {
        const videoExt = videoFile.name.split('.').pop();
        const videoFileName = `${Date.now()}-video.${videoExt}`;
        const videoPath = `${user?.id}/videos/${videoFileName}`;

        const { error: videoUploadError } = await supabase.storage
          .from('product-images')
          .upload(videoPath, videoFile, { cacheControl: '3600', upsert: false });

        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError);
          premiumNotify.error(
            "Erreur upload vidéo",
            videoUploadError.message || "Le fichier vidéo n'a pas pu être uploadé. Vérifiez le format (MP4/WebM) et la taille (max 15 Mo)."
          );
          setIsSubmitting(false);
          return;
        }

        const { data: videoUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(videoPath);

        videoUrl = videoUrlData.publicUrl;
      }

      // If video was removed (had one before, now null)
      if (!videoPreviewUrl && product.video_url) {
        videoUrl = null;
      }

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock_count) || 0,
        category: formData.category,
        condition: formData.condition,
        status: formData.status,
        images: imageUrls,
        video_url: videoUrl,
        updated_at: new Date().toISOString()
      };

      let willRequireRemoderation = false;
      if (product.moderation_status === 'approved') {
        updateData.moderation_status = 'pending';
        updateData.moderated_at = null;
        updateData.moderator_id = null;
        willRequireRemoderation = true;
      }

      const { error } = await supabase
        .from('marketplace_products')
        .update(updateData)
        .eq('id', formData.id);

      if (error) throw error;

      if (willRequireRemoderation) {
        premiumNotify.marketplace(
          "Produit re-soumis en modération",
          "Vos modifications ont été enregistrées. Vous serez notifié une fois le produit vérifié."
        );
      } else {
        premiumNotify.success(
          "Produit mis à jour",
          "Les modifications ont été enregistrées avec succès."
        );
      }

      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error updating product:', error);
      premiumNotify.error(
        "Erreur de modification",
        "Une erreur est survenue lors de la modification du produit."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-28">
      {/* ── Header glassmorphism ── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/60 hover:bg-muted transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Modifier le produit</h1>
              <p className="text-xs text-muted-foreground">Mettez à jour les informations</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-2.5 py-1 font-semibold ${moderationBadge.className}`}>
            {moderationBadge.label}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5 max-w-lg mx-auto">

        {/* ── Section Photos ── */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Photos du produit</h2>
                <p className="text-[11px] text-muted-foreground">Max 5MB par photo</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary bg-primary/5">
              {imagePreviews.length}/5
            </Badge>
          </div>

          <div className="px-5 pb-5">
            {imagePreviews.length === 0 ? (
              /* Empty state */
              <label className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/[0.02] cursor-pointer hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ImagePlus className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Ajoutez vos photos</p>
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  De belles photos augmentent vos ventes de 60%
                </p>
                <div className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  Parcourir les fichiers
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square group rounded-2xl overflow-hidden shadow-md border border-border/30">
                    <img 
                      src={preview} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => removeImage(index)}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 shadow-lg hover:bg-destructive"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    
                    {index === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
                        <Sparkles className="h-2.5 w-2.5" />
                        Principal
                      </div>
                    )}
                  </div>
                ))}

                {formData.images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-primary/25 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group">
                    <Upload className="w-6 h-6 text-primary/40 group-hover:text-primary mb-1 transition-colors duration-200" />
                    <span className="text-[10px] font-semibold text-primary/50 group-hover:text-primary transition-colors">Ajouter</span>
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
            )}
          </div>
        </div>

        {/* ── Section Vidéo ── */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Vidéo de présentation</h2>
                <p className="text-[11px] text-muted-foreground">Max 15s, 10MB · MP4/WebM</p>
              </div>
            </div>
            {videoPreviewUrl && (
              <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                ✓ Vidéo ajoutée
              </Badge>
            )}
          </div>

          <div className="px-5 pb-5">
            {videoPreviewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/30 shadow-md">
                <video
                  src={videoPreviewUrl}
                  className="w-full max-h-48 object-cover bg-black"
                  controls
                  muted
                  playsInline
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive/90 text-white flex items-center justify-center shadow-lg hover:bg-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/[0.02] cursor-pointer hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group">
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Ajoutez une vidéo</p>
                <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                  Une courte vidéo augmente la confiance des acheteurs
                </p>
                <div className="mt-3 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  Choisir une vidéo
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* ── Section Détails ── */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent">
              <FileText className="w-4 h-4 text-accent-foreground" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Informations</h2>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Tag className="h-3 w-3" />
                Titre *
              </Label>
              <Input
                id="title"
                placeholder="Ex: iPhone 15 Pro Max 256GB"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={100}
                className="h-11 rounded-xl border-border/60 focus:border-primary/50 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit, son état, ses caractéristiques..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                maxLength={500}
                className="rounded-xl border-border/60 focus:border-primary/50 bg-background resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{formData.description.length}/500</p>
            </div>

            <div className="h-px bg-border/40 my-1" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Layers className="h-3 w-3" />
                  Catégorie *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
                    <SelectValue placeholder="Choisir" />
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

              <div className="space-y-1.5">
                <Label htmlFor="condition" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3" />
                  État
                </Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
                    <SelectValue placeholder="État" />
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

            <div className="h-px bg-border/40 my-1" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <DollarSign className="h-3 w-3" />
                  Prix (FC) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="850 000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  min="0"
                  className="h-11 rounded-xl border-border/60 focus:border-primary/50 bg-background font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock_count" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Package className="h-3 w-3" />
                  Stock *
                </Label>
                <Input
                  id="stock_count"
                  type="number"
                  placeholder="10"
                  value={formData.stock_count}
                  onChange={(e) => handleInputChange('stock_count', e.target.value)}
                  min="0"
                  className="h-11 rounded-xl border-border/60 focus:border-primary/50 bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <ToggleLeft className="h-3 w-3" />
                Statut
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
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
          </div>
        </div>
      </form>

      {/* ── Sticky bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/40 px-4 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="flex-1 h-12 rounded-xl font-semibold border-border/60"
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            className="flex-1 h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Modification...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
};
