import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageUploadProps {
  restaurantId: string;
  currentImages: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export const ProductImageUpload = ({ 
  restaurantId, 
  currentImages, 
  onImagesChange,
  maxImages = 5 
}: ProductImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `${restaurantId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('restaurant_products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant_products')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible d\'uploader l\'image',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast({
        title: 'Limite atteinte',
        description: `Maximum ${maxImages} images autorisées`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Type invalide',
          description: `${file.name} n'est pas une image`,
          variant: 'destructive',
        });
        continue;
      }

      // Vérifier la taille (5 MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse 5 MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Compresser l'image
      const compressedFile = await compressImage(file);
      
      // Uploader
      const url = await uploadImage(compressedFile);
      if (url) {
        newUrls.push(url);
      }

      setUploadProgress(((i + 1) / files.length) * 100);
    }

    if (newUrls.length > 0) {
      onImagesChange([...currentImages, ...newUrls]);
      toast({
        title: 'Succès',
        description: `${newUrls.length} image(s) uploadée(s)`,
      });
    }

    setUploading(false);
    setUploadProgress(0);
    e.target.value = '';
  };

  const handleRemoveImage = async (url: string) => {
    try {
      // Extraire le path depuis l'URL
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/restaurant_products/')[1];
      
      if (path) {
        const { error } = await supabase.storage
          .from('restaurant_products')
          .remove([path]);

        if (error) {
          console.error('Delete error:', error);
        }
      }

      onImagesChange(currentImages.filter(img => img !== url));
      
      toast({
        title: 'Image supprimée',
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'image',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || currentImages.length >= maxImages}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Upload {uploadProgress.toFixed(0)}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des photos ({currentImages.length}/{maxImages})
            </>
          )}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || currentImages.length >= maxImages}
        />
      </div>

      {/* Image Previews */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((url, index) => (
            <div
              key={url}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border-2",
                index === 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <img
                src={url}
                alt={`Produit ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Photo principale
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentImages.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Aucune photo ajoutée
          </p>
          <p className="text-xs text-muted-foreground">
            Cliquez sur "Ajouter des photos" pour commencer
          </p>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        ℹ️ La première photo sera utilisée comme image principale. Max 5 MB par image.
      </p>
    </div>
  );
};
