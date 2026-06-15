import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentUploadProps {
  label: string;
  description?: string;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  existingUrl?: string;
  required?: boolean;
}

export const DocumentUpload = ({
  label,
  description,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSizeMB = 5,
  onUpload,
  existingUrl,
  required = false
}: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(!!existingUrl);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Le fichier est trop volumineux (max ${maxSizeMB}MB)`);
      return false;
    }

    // Check type
    const fileType = file.type;
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isAccepted) {
      toast.error('Type de fichier non accepté');
      return false;
    }

    return true;
  };

  const handleFile = async (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setUploadSuccess(false);

    // Generate preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Upload
    setUploading(true);
    try {
      const result = await onUpload(selectedFile);
      if (result.success) {
        setUploadSuccess(true);
        toast.success('Document téléchargé avec succès');
      } else {
        throw new Error(result.error || 'Erreur lors du téléchargement');
      }
    } catch (error: any) {
      toast.error(error.message);
      setFile(null);
      setPreview(existingUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadSuccess(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isImage = file?.type.startsWith('image/') || preview?.startsWith('data:image');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {uploadSuccess && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Téléchargé
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      <AnimatePresence mode="wait">
        {!file && !preview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Card className={cn(
              "border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10",
              dragActive && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
            )}>
              <CardContent 
                className="p-8 text-center"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliquez ou glissez votre fichier ici
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Max {maxSizeMB}MB • {acceptedTypes.join(', ')}
                </p>
              </CardContent>
            </Card>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={handleChange}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {isImage && preview ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <File className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file?.name || 'Document existant'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>

                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  ) : uploadSuccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
