import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface PartnerImageUploadProps {
  type: 'logo' | 'banner';
  currentUrl?: string | null;
  userId: string;
  onUploadComplete: (url: string) => void;
  className?: string;
}

export const PartnerImageUpload: React.FC<PartnerImageUploadProps> = ({
  type,
  currentUrl,
  userId,
  onUploadComplete,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const config = {
    logo: {
      label: 'Logo',
      aspectRatio: 'aspect-square',
      maxSize: 2, // MB
      dimensions: { width: 400, height: 400 },
      placeholder: 'Ajouter un logo'
    },
    banner: {
      label: 'Photo de couverture',
      aspectRatio: 'aspect-[3/1]',
      maxSize: 5, // MB
      dimensions: { width: 1200, height: 400 },
      placeholder: 'Ajouter une photo de couverture'
    }
  };

  const currentConfig = config[type];

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: currentConfig.maxSize,
      maxWidthOrHeight: Math.max(currentConfig.dimensions.width, currentConfig.dimensions.height),
      useWebWorker: true,
      fileType: 'image/jpeg' as const
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Compression error:', error);
      return file;
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > currentConfig.maxSize * 1024 * 1024) {
      toast.error(`L'image ne doit pas dépasser ${currentConfig.maxSize}MB`);
      return;
    }

    setUploading(true);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    try {
      // Compress image
      const compressedFile = await compressImage(file);
      
      const fileExt = 'jpg';
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Delete old file if exists
      if (currentUrl) {
        const oldPath = currentUrl.split('/partner-assets/')[1];
        if (oldPath) {
          await supabase.storage.from('partner-assets').remove([oldPath]);
        }
      }

      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('partner-assets')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Message d'erreur explicite selon le type d'erreur
        if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
          throw new Error('Permission refusée. Veuillez vous reconnecter et réessayer.');
        } else if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('size')) {
          throw new Error(`Image trop volumineuse (max ${currentConfig.maxSize}MB)`);
        } else if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
          throw new Error('Erreur réseau. Vérifiez votre connexion internet.');
        } else {
          throw new Error(`Échec de l'upload: ${uploadError.message}`);
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update partenaires table
      const updateField = type === 'logo' ? 'logo_url' : 'banner_image';
      const { error: updateError } = await supabase
        .from('partenaires')
        .update({ 
          [updateField]: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Image uploadée mais échec de la mise à jour du profil. Réessayez.');
      }

      onUploadComplete(publicUrl);
      toast.success(`${currentConfig.label} mis à jour avec succès`);
    } catch (error: any) {
      console.error('Error uploading:', error);
      const errorMessage = error?.message || `Erreur lors de l'upload du ${currentConfig.label.toLowerCase()}`;
      toast.error(errorMessage);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const displayUrl = previewUrl || currentUrl;

  if (type === 'logo') {
    return (
      <div className={cn("relative group", className)}>
        <motion.div 
          className={cn(
            "relative h-28 w-28 rounded-full overflow-hidden",
            "ring-4 ring-white/50 dark:ring-gray-800/50 shadow-2xl",
            dragOver && "ring-emerald-500"
          )}
          whileHover={{ scale: 1.02 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-white/60" />
            </div>
          )}
          
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
              uploading && "opacity-100"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </motion.button>
        </motion.div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Cliquez pour modifier
        </p>
      </div>
    );
  }

  // Banner style
  return (
    <div 
      className={cn(
        "relative w-full h-36 md:h-52 rounded-xl overflow-hidden",
        "bg-gradient-to-r from-muted/60 to-muted/40",
        dragOver && "ring-2 ring-primary",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {displayUrl ? (
        <img 
          src={displayUrl} 
          alt="Couverture" 
          className="w-full h-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/60 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-sm">
            <Camera className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground/80">Ajouter une photo de couverture</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG ou WebP • Max {currentConfig.maxSize}MB</p>
          </div>
        </button>
      )}
      
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3"
          >
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <span className="text-sm font-medium text-white">Upload en cours...</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {displayUrl && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 right-3 gap-2 backdrop-blur-sm bg-background/80 shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4" />
          Modifier
        </Button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
