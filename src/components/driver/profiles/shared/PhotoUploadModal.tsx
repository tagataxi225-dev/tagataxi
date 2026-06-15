/**
 * 📸 Modal d'upload photo profil avec preview
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhoto?: string;
  onUploadSuccess: (url: string) => void;
  profileType?: 'taxi' | 'delivery';
}

export const PhotoUploadModal = ({ 
  open, 
  onOpenChange, 
  currentPhoto,
  onUploadSuccess,
  profileType = 'taxi'
}: PhotoUploadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier taille max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La photo doit faire moins de 5MB",
        variant: "destructive"
      });
      return;
    }

    // Vérifier type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Type de fichier invalide",
        description: "Veuillez sélectionner une image",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Créer preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Préparer le FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('profileType', profileType);

      console.log('[PhotoUpload] Uploading via Edge Function...');

      // Appel à l'Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/driver-profile-photo-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'upload');
      }

      console.log('[PhotoUpload] Success:', result);

      toast({
        title: "✅ Photo mise à jour",
        description: "Votre photo de profil a été changée avec succès"
      });

      onUploadSuccess(result.publicUrl);
      onOpenChange(false);
      
      // Reset
      setPreview(null);
      setSelectedFile(null);

    } catch (error: any) {
      console.error('[PhotoUpload] Error:', error);
      toast({
        title: "❌ Erreur d'upload",
        description: error.message || "Impossible de télécharger la photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la photo de profil</DialogTitle>
          <DialogDescription>
            Choisissez une photo claire de vous. Max 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview ou photo actuelle */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt="Current" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById('photo-upload-input')?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choisir une photo
            </Button>

            {preview && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Input file caché */}
          <input
            id="photo-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          {/* Actions finales */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={uploading}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Upload en cours...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
