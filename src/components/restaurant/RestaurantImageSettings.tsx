import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';

interface RestaurantImages {
  logo_url: string | null;
  banner_url: string | null;
}

interface RestaurantImageSettingsProps {
  onImageUpdate?: () => void;
}

export function RestaurantImageSettings({ onImageUpdate }: RestaurantImageSettingsProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState<RestaurantImages>({
    logo_url: null,
    banner_url: null
  });
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    type: 'logo' | 'banner';
    file: File;
  } | null>(null);

  useEffect(() => {
    console.log('🎨 [RestaurantImages] Composant monté', { 
      user: user?.id, 
      userExists: !!user 
    });
    
    if (user) {
      loadImages();
    }
  }, [user]);

  const loadImages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('logo_url, banner_url')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setImages({
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement images:', error);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!user) {
      console.error('❌ [RestaurantImages] User non défini');
      return;
    }
    
    console.log(`🖼️ [RestaurantImages] Début upload ${type}:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
      userId: user.id
    });
    
    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Fichier trop volumineux:', file.size);
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      console.error('❌ Format invalide:', file.type);
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG ou WebP)",
        variant: "destructive"
      });
      return;
    }

    setUploading(type);
    setUploadProgress(0);
    
    try {
      // 🗜️ Compression automatique si > 500KB
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        console.log('🗜️ Compression de l\'image...');
        toast({
          title: "Compression en cours...",
          description: "Optimisation de l'image pour un upload plus rapide"
        });
        
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: type === 'logo' ? 500 : 1920,
          useWebWorker: true,
          onProgress: (percent) => {
            setUploadProgress(Math.round(percent / 2)); // 0-50% pour compression
          }
        });
        
        console.log('✅ Image compressée:', {
          before: `${(file.size / 1024).toFixed(2)} KB`,
          after: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
          reduction: `${(((file.size - fileToUpload.size) / file.size) * 100).toFixed(1)}%`
        });
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      console.log(`📤 [RestaurantImages] Upload vers Storage...`, { fileName });

      // Upload vers le bucket 'restaurant-images' avec progression
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, fileToUpload, { upsert: true });

      if (uploadError) {
        console.error('❌ [RestaurantImages] Erreur Storage upload:', uploadError);
        throw uploadError;
      }
      
      setUploadProgress(100);
      
      console.log('✅ [RestaurantImages] Upload Storage réussi:', uploadData);

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      console.log(`🔗 [RestaurantImages] URL publique générée:`, publicUrl);
      
      // Mettre à jour le profil restaurant
      const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
      console.log(`💾 [RestaurantImages] Mise à jour de ${updateField}...`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('restaurant_profiles')
        .update({ 
          [updateField]: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ [RestaurantImages] Erreur mise à jour profil:', updateError);
        throw updateError;
      }
      
      console.log('✅ [RestaurantImages] Profil mis à jour:', updateData);

      // Mettre à jour l'état local
      setImages(prev => ({
        ...prev,
        [updateField]: publicUrl
      }));

      toast({
        title: "✅ Image uploadée",
        description: `${type === 'logo' ? 'Logo' : 'Bannière'} mis(e) à jour avec succès`
      });
      
      console.log(`✅ [RestaurantImages] Upload ${type} terminé avec succès`);

      // Force browser cache invalidation
      const img = new Image();
      img.src = `${publicUrl}?t=${Date.now()}`;

      // Callback pour rafraîchir le parent
      if (onImageUpdate) {
        onImageUpdate();
      }

      // Notification de rafraîchissement
      setTimeout(() => {
        toast({
          title: '🔄 Mise à jour complète',
          description: 'Votre restaurant a été rafraîchi dans Tembea Food'
        });
      }, 500);
    } catch (error: any) {
      console.error('❌ [RestaurantImages] Erreur upload complète:', {
        message: error.message,
        details: error,
        stack: error.stack
      });
      toast({
        title: "Erreur d'upload",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (file: File, type: 'logo' | 'banner') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage({
        url: reader.result as string,
        type,
        file
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = async (type: 'logo' | 'banner') => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurant_profiles')
        .update({ 
          [type === 'logo' ? 'logo_url' : 'banner_url']: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setImages(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'banner_url']: null
      }));

      toast({
        title: "Image supprimée",
        description: `${type === 'logo' ? 'Logo' : 'Bannière'} supprimé(e) avec succès`
      });

      // Callback pour rafraîchir le parent
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images du restaurant
        </CardTitle>
        <CardDescription>
          Gérez votre logo et bannière
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Logo */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Logo du restaurant</Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {images.logo_url ? (
              <div className="relative">
                <img 
                  src={images.logo_url} 
                  alt="Logo restaurant" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                  onClick={() => removeImage('logo')}
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <Button
                variant="outline"
                disabled={uploading === 'logo'}
                onClick={() => {
                  console.log('🖱️ [RestaurantImages] Click bouton logo');
                  const input = document.getElementById('logo-upload');
                  console.log('📄 [RestaurantImages] Input logo trouvé:', !!input);
                  input?.click();
                }}
                className="w-full sm:w-auto"
              >
                {uploading === 'logo' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading === 'logo' ? 'Upload en cours...' : 'Choisir un fichier'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  console.log('📁 [RestaurantImages] Input logo onChange déclenché');
                  const file = e.target.files?.[0];
                  console.log('📁 [RestaurantImages] Fichier logo sélectionné:', file?.name || 'AUCUN');
                  if (file) {
                    console.log('✅ [RestaurantImages] Affichage aperçu logo...');
                    handleFileSelect(file, 'logo');
                  } else {
                    console.warn('⚠️ [RestaurantImages] Aucun fichier logo sélectionné');
                  }
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format carré recommandé • JPG, PNG ou WebP • Max 5MB
              </p>
              {uploading === 'logo' && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress < 50 ? 'Compression...' : 'Upload...'} {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Bannière */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Bannière du restaurant</Label>
          <div className="space-y-3">
            {images.banner_url ? (
              <div className="relative">
                <img 
                  src={images.banner_url} 
                  alt="Bannière restaurant" 
                  className="w-full h-40 rounded-lg object-cover border-2 border-primary/20 shadow-sm"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                  onClick={() => removeImage('banner')}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-full h-40 rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Aucune bannière</p>
              </div>
            )}
            <div className="space-y-2">
              <Button
                variant="outline"
                disabled={uploading === 'banner'}
                onClick={() => {
                  console.log('🖱️ [RestaurantImages] Click bouton bannière');
                  const input = document.getElementById('banner-upload');
                  console.log('📄 [RestaurantImages] Input bannière trouvé:', !!input);
                  input?.click();
                }}
                className="w-full sm:w-auto"
              >
                {uploading === 'banner' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading === 'banner' ? 'Upload en cours...' : 'Choisir un fichier'}
              </Button>
              <input
                id="banner-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  console.log('📁 [RestaurantImages] Input bannière onChange déclenché');
                  const file = e.target.files?.[0];
                  console.log('📁 [RestaurantImages] Fichier bannière sélectionné:', file?.name || 'AUCUN');
                  if (file) {
                    console.log('✅ [RestaurantImages] Affichage aperçu bannière...');
                    handleFileSelect(file, 'banner');
                  } else {
                    console.warn('⚠️ [RestaurantImages] Aucun fichier bannière sélectionné');
                  }
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format paysage 16:9 recommandé • JPG, PNG ou WebP • Max 5MB
              </p>
              {uploading === 'banner' && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress < 50 ? 'Compression...' : 'Upload...'} {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Dialog d'aperçu avant upload */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
            <DialogDescription>
              Vérifiez votre image avant de l'uploader
            </DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
              {previewImage && (
                <img 
                  src={previewImage.url} 
                  alt="Preview"
                  className={
                    previewImage.type === 'logo' 
                      ? 'w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20 shadow-lg'
                      : 'w-full max-h-64 rounded-lg object-cover border-2 border-primary/20 shadow-lg'
                  }
                />
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => {
                  if (previewImage) {
                    uploadImage(previewImage.file, previewImage.type);
                    setPreviewImage(null);
                  }
                }}
                className="flex-1"
                disabled={uploading !== null}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Confirmer l'upload
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setPreviewImage(null)}
                disabled={uploading !== null}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
