import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

interface RentalImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function RentalImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}: RentalImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxImages} images autorisées`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const uploadedUrls: string[] = [];

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData?.user) {
        toast({
          title: "Non authentifié",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        return;
      }

      for (const file of filesToUpload) {
        // Vérifier le type MIME
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Fichier invalide",
            description: `${file.name} n'est pas une image`,
            variant: "destructive"
          });
          continue;
        }

        // Compression de l'image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg'
        });

        // Upload vers Supabase Storage
        const fileExtension = compressedFile.type.split('/')[1] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `${userData.user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('rental-vehicles')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Erreur d'upload",
            description: uploadError.message,
            variant: "destructive"
          });
          continue;
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('rental-vehicles')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast({
          title: "Succès",
          description: `${uploadedUrls.length} image(s) ajoutée(s)`
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader les images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extraire le chemin du fichier depuis l'URL
    try {
      const urlParts = imageUrl.split('/rental-vehicles/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        
        // Supprimer du Storage
        const { error } = await supabase.storage
          .from('rental-vehicles')
          .remove([filePath]);
        
        if (error) {
          console.error('Delete error:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
    
    // Retirer de l'état dans tous les cas
    onImagesChange(images.filter((_, i) => i !== index));
    toast({ title: "Image supprimée" });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('rental-image-input')?.click()}
      >
        <input
          id="rental-image-input"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading || images.length >= maxImages}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Cliquez ou glissez-déposez vos images
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP • Max {maxImages} images • Max 5MB par image
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {images.length}/{maxImages} images ajoutées
            </p>
          </div>
        )}
      </Card>

      {/* Aperçu des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
