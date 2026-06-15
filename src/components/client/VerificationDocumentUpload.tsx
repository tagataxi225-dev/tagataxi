import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileCheck, AlertCircle, CheckCircle, X, Shield, ChevronDown, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserVerification } from '@/hooks/useUserVerification';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const VerificationDocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { verification, fetchVerificationStatus } = useUserVerification();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 5MB',
        variant: 'destructive'
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Format non supporté',
        description: 'Formats acceptés : JPG, PNG, PDF',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/identity_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('user_verification')
        .update({
          identity_document_url: fileName,
          verification_status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: '✅ Document envoyé',
        description: 'Vérification en cours (24-48h)'
      });

      await fetchVerificationStatus();
      setSelectedFile(null);
      setPreviewUrl(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible d\'envoyer le document',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusConfig = () => {
    const status = verification?.verification_status || 'none';
    
    const configs = {
      'none': { 
        label: 'Non vérifié', 
        icon: AlertCircle, 
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        border: 'border-muted-foreground/20',
        badgeBg: 'bg-muted'
      },
      'pending_review': { 
        label: 'En attente', 
        icon: Upload, 
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        border: 'border-orange-300 dark:border-orange-800',
        badgeBg: 'bg-orange-100 dark:bg-orange-900/50'
      },
      'approved': { 
        label: 'Vérifié ✓', 
        icon: CheckCircle, 
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-950/20',
        border: 'border-green-300 dark:border-green-800',
        badgeBg: 'bg-green-100 dark:bg-green-900/50'
      },
      'rejected': { 
        label: 'Rejeté', 
        icon: X, 
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-300 dark:border-red-800',
        badgeBg: 'bg-red-100 dark:bg-red-900/50'
      }
    };

    return configs[status as keyof typeof configs] || configs.none;
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "w-full rounded-2xl p-4 transition-all duration-300",
            "border shadow-sm hover:shadow-md",
            "flex items-center gap-4 text-left",
            statusConfig.bg,
            statusConfig.border
          )}
        >
          {/* Icon */}
          <div className={cn(
            "p-3 rounded-xl backdrop-blur-sm",
            "bg-gradient-to-br from-primary/10 to-accent/10",
            "border border-primary/20"
          )}>
            <Shield className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-foreground">
                Vérification d'identité
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium px-2 py-0.5",
                  statusConfig.badgeBg,
                  statusConfig.color
                )}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isOpen ? 'Cliquez pour réduire' : 'Cliquez pour vérifier votre identité'}
            </p>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </motion.button>
      </CollapsibleTrigger>

      <AnimatePresence>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Info documents - compact */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>CNI, Passeport ou Permis • JPG, PNG, PDF • Max 5MB</span>
                </div>

                {/* Document déjà uploadé */}
                {verification?.identity_document_url && (
                  <div className={cn(
                    "flex items-center gap-3 rounded-xl p-3",
                    statusConfig.bg,
                    "border",
                    statusConfig.border
                  )}>
                    <FileCheck className={cn("h-5 w-5", statusConfig.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Document soumis
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {verification.verification_status === 'pending_review' 
                          ? 'En cours de vérification (24-48h)'
                          : verification.verification_status === 'approved'
                          ? 'Identité vérifiée avec succès'
                          : 'Vous pouvez soumettre un nouveau document'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Zone d'upload compacte */}
                <label className="block">
                  <div className={cn(
                    "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
                    selectedFile 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/30'
                  )}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={previewUrl} 
                          alt="Aperçu" 
                          className="max-h-32 mx-auto rounded-lg shadow-sm"
                        />
                        <p className="text-xs font-medium text-primary truncate">
                          {selectedFile?.name}
                        </p>
                      </div>
                    ) : selectedFile ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary truncate">
                          {selectedFile.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Sélectionner un document
                        </span>
                      </div>
                    )}
                  </div>
                </label>

                {/* Boutons d'action */}
                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1"
                      size="sm"
                    >
                      {isUploading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Envoyer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      variant="outline"
                      disabled={isUploading}
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                {/* Info sécurité - ultra compact */}
                <p className="text-[10px] text-muted-foreground text-center">
                  🔒 Documents sécurisés • Visible uniquement par les admins
                </p>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
};
