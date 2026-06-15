import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import { useAuth } from '@/hooks/useAuth';

interface ImageAttachmentProps {
  onImageSelect: (file: File | null) => void;
  disabled?: boolean;
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  onImageSelect,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 10 Mo)');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });

      onImageSelect(compressedFile as File);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="h-11 w-11 rounded-xl border-2 hover:bg-primary/10 hover:border-primary transition-all flex-shrink-0"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

interface ImagePreviewProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X className="h-5 w-5" />
      </Button>
      <motion.img
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
};

interface ImageMessageProps {
  imageUrl: string;
  onClick?: () => void;
  className?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUrl,
  onClick,
  className
}) => {
  return (
    <motion.img
      src={imageUrl}
      alt="Image partagée"
      className={cn(
        "max-w-[200px] max-h-[200px] rounded-lg cursor-pointer object-cover mb-1",
        "hover:opacity-90 transition-opacity",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    />
  );
};

// Upload image to Supabase Storage
export const uploadChatImage = async (
  file: File,
  conversationId: string
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};
