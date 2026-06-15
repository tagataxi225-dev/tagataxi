/**
 * 📄 Modal upload document chauffeur
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Calendar, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDriverDocuments, DriverDocument } from '@/hooks/useDriverDocuments';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: DriverDocument['type'];
  documentLabel: string;
  requiresExpiry?: boolean;
}

export const DocumentUploadModal = ({
  open,
  onOpenChange,
  documentType,
  documentLabel,
  requiresExpiry = true
}: DocumentUploadModalProps) => {
  const { uploadDocument } = useDriverDocuments();
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux', {
          description: 'La taille maximale est de 5 Mo'
        });
        return;
      }

      // Vérifier le type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Type de fichier non supporté', {
          description: 'Formats acceptés : JPG, PNG, WebP, PDF'
        });
        return;
      }

      setFile(selectedFile);

      // Prévisualisation pour les images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (requiresExpiry && !expiryDate) {
      toast.error('Veuillez indiquer la date d\'expiration');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        file,
        documentType,
        expiresAt: expiryDate || undefined
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setExpiryDate('');
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {documentLabel}
          </DialogTitle>
          <DialogDescription>
            Téléversez une photo ou un scan de votre document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Zone d'upload */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.label
                  key="upload-zone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    JPG, PNG, WebP ou PDF • Max 5 Mo
                  </p>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                  />
                </motion.label>
              ) : (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative p-4 border border-border rounded-xl bg-muted/20"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <FileText className="h-12 w-12 text-primary" />
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} Mo
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date d'expiration */}
          {requiresExpiry && (
            <div className="space-y-2">
              <Label htmlFor="expiry" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date d'expiration
              </Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
          )}

          {/* Bouton submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!file || uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Envoyer le document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
