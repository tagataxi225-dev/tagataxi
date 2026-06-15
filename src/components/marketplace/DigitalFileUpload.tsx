import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  FileCode, Upload, X, FileText, Music, Video, FileArchive, 
  Image, Loader2, CheckCircle, Download, Infinity as InfinityIcon, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DigitalFileUploadProps {
  onFileUploaded: (fileData: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => void;
  downloadLimit: number;
  onDownloadLimitChange: (limit: number) => void;
  currentFile?: {
    url: string;
    name: string;
    size: number;
    type: string;
  } | null;
}

const FILE_TYPE_CONFIG = {
  'application/pdf': { icon: FileText, label: 'PDF', bgClass: 'bg-red-500/10', textClass: 'text-red-500', borderClass: 'border-red-500/30' },
  'application/zip': { icon: FileArchive, label: 'ZIP', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', borderClass: 'border-amber-500/30' },
  'application/x-zip-compressed': { icon: FileArchive, label: 'ZIP', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', borderClass: 'border-amber-500/30' },
  'audio/mpeg': { icon: Music, label: 'MP3', bgClass: 'bg-violet-500/10', textClass: 'text-violet-500', borderClass: 'border-violet-500/30' },
  'audio/mp3': { icon: Music, label: 'MP3', bgClass: 'bg-violet-500/10', textClass: 'text-violet-500', borderClass: 'border-violet-500/30' },
  'video/mp4': { icon: Video, label: 'MP4', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500', borderClass: 'border-blue-500/30' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX', bgClass: 'bg-blue-600/10', textClass: 'text-blue-600', borderClass: 'border-blue-600/30' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'XLSX', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', borderClass: 'border-emerald-500/30' },
  'image/png': { icon: Image, label: 'PNG', bgClass: 'bg-pink-500/10', textClass: 'text-pink-500', borderClass: 'border-pink-500/30' },
  'image/jpeg': { icon: Image, label: 'JPG', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', borderClass: 'border-orange-500/30' },
};

const FORMAT_BADGES = [
  { label: 'PDF', Icon: FileText, color: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20' },
  { label: 'ZIP', Icon: FileArchive, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' },
  { label: 'MP3', Icon: Music, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20' },
  { label: 'MP4', Icon: Video, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20' },
  { label: 'DOC', Icon: FileText, color: 'bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20' },
  { label: 'IMG', Icon: Image, color: 'bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20' },
];

const DOWNLOAD_PRESETS = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: -1, label: '∞', tooltip: 'Illimité' },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const DigitalFileUpload: React.FC<DigitalFileUploadProps> = ({
  onFileUploaded,
  downloadLimit,
  onDownloadLimitChange,
  currentFile
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<typeof currentFile>(currentFile);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const getFileTypeInfo = useCallback((mimeType: string) => {
    return FILE_TYPE_CONFIG[mimeType as keyof typeof FILE_TYPE_CONFIG] || { 
      icon: FileCode, 
      label: 'Fichier', 
      bgClass: 'bg-muted',
      textClass: 'text-muted-foreground',
      borderClass: 'border-muted'
    };
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    if (!Object.keys(FILE_TYPE_CONFIG).includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Type de fichier non supporté',
        description: 'Formats acceptés : PDF, ZIP, MP3, MP4, DOCX, XLSX, PNG, JPG'
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Fichier trop volumineux',
        description: 'La taille maximum est de 100 MB'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const fileExt = file.name.split('.').pop();
      const uniqueName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('digital-products')
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);

      const fileData = {
        url: data.path,
        name: file.name,
        size: file.size,
        type: file.type
      };

      setUploadedFile(fileData);
      onFileUploaded(fileData);

      toast({
        title: 'Fichier téléchargé ✓',
        description: `${file.name} est prêt pour la vente`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible de télécharger le fichier'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onFileUploaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleUpload]);

  const removeFile = useCallback(async () => {
    if (uploadedFile?.url) {
      try {
        await supabase.storage.from('digital-products').remove([uploadedFile.url]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setUploadedFile(null);
    onFileUploaded({ url: '', name: '', size: 0, type: '' });
  }, [uploadedFile, onFileUploaded]);

  const handlePresetClick = useCallback((value: number) => {
    onDownloadLimitChange(value === -1 ? 999 : value);
  }, [onDownloadLimitChange]);

  const sliderValue = useMemo(() => {
    return downloadLimit >= 999 ? 100 : Math.min(downloadLimit, 50);
  }, [downloadLimit]);

  const handleSliderChange = useCallback((values: number[]) => {
    const val = values[0];
    if (val >= 100) {
      onDownloadLimitChange(999);
    } else {
      onDownloadLimitChange(val);
    }
  }, [onDownloadLimitChange]);

  const displayLimit = useMemo(() => {
    return downloadLimit >= 999 ? '∞' : downloadLimit.toString();
  }, [downloadLimit]);

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.zip,.mp3,.mp4,.docx,.xlsx,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
      />

      {/* Upload Zone - Entièrement cliquable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={cn(
            "relative overflow-hidden border-2 border-dashed transition-all duration-300 cursor-pointer group",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 via-background to-violet-500/5",
            isUploading && "pointer-events-none",
            uploadedFile?.url && "cursor-default"
          )}
          onClick={() => {
            if (!uploadedFile?.url && !isUploading) {
              triggerFileSelect();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Animated background gradient on drag */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/10 to-purple-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />

          <CardContent className="relative p-6 md:p-8">
            <AnimatePresence mode="wait">
              {uploadedFile?.url ? (
                // Fichier uploadé avec succès
                <motion.div
                  key="uploaded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-4"
                >
                  <motion.div 
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center border-2",
                      getFileTypeInfo(uploadedFile.type).bgClass,
                      getFileTypeInfo(uploadedFile.type).borderClass
                    )}
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {(() => {
                      const { icon: Icon, textClass } = getFileTypeInfo(uploadedFile.type);
                      return <Icon className={cn("h-8 w-8", textClass)} />;
                    })()}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </motion.div>
                      <span className="font-semibold truncate text-foreground">{uploadedFile.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className={cn("text-xs", getFileTypeInfo(uploadedFile.type).textClass)}>
                        {getFileTypeInfo(uploadedFile.type).label}
                      </Badge>
                      <span>•</span>
                      <span>{formatFileSize(uploadedFile.size)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
              ) : isUploading ? (
                // Upload en cours
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div 
                    className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity as number, duration: 1.5 }}
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Upload en cours...</p>
                    <div className="max-w-xs mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                  </div>
                </motion.div>
              ) : (
                // Zone de drop vide
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4"
                >
                  {/* Icône animée */}
                  <motion.div 
                    className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-full flex items-center justify-center relative"
                    whileHover={{ scale: 1.05 }}
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  >
                    <motion.div
                      animate={isDragging ? { y: [0, -5, 0] } : {}}
                      transition={{ repeat: Infinity as number, duration: 0.5 }}
                    >
                      <Upload className="h-10 w-10 text-primary" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity as number, duration: 2, delay: 0.5 }}
                    >
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </motion.div>
                  </motion.div>

                  {/* Titre et description */}
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    Téléchargez votre fichier digital
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Glissez-déposez ou cliquez n'importe où
                  </p>

                  {/* Badges de formats colorés */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {FORMAT_BADGES.map(({ label, Icon, color }) => (
                      <Badge 
                        key={label} 
                        variant="outline"
                        className={cn(
                          "text-xs font-medium px-3 py-1.5 gap-1.5 transition-colors border",
                          color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Badge>
                    ))}
                  </div>

                  {/* Bouton principal violet */}
                  <Button 
                    type="button"
                    className="gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileSelect();
                    }}
                  >
                    <Upload className="h-5 w-5" />
                    Choisir un fichier
                  </Button>

                  {/* Info taille max */}
                  <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5" />
                    Maximum 100 MB
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Limite de téléchargements - Design moderne */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-base font-semibold text-foreground">
                  Téléchargements autorisés
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nombre de fois que l'acheteur peut télécharger
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {displayLimit}
              </div>
            </div>

            {/* Slider */}
            <div className="mb-4 px-1">
              <Slider
                value={[sliderValue]}
                onValueChange={handleSliderChange}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Présets rapides */}
            <div className="flex items-center justify-center gap-2">
              {DOWNLOAD_PRESETS.map(({ value, label, tooltip }) => (
                <Button
                  key={value}
                  type="button"
                  variant={
                    (value === -1 && downloadLimit >= 999) || 
                    (value !== -1 && downloadLimit === value) 
                      ? "default" 
                      : "outline"
                  }
                  size="sm"
                  className={cn(
                    "min-w-[48px] h-9 font-semibold transition-all",
                    ((value === -1 && downloadLimit >= 999) || (value !== -1 && downloadLimit === value)) &&
                    "bg-primary text-primary-foreground shadow-md"
                  )}
                  onClick={() => handlePresetClick(value)}
                  title={tooltip}
                >
                  {value === -1 ? <InfinityIcon className="h-4 w-4" /> : label}
                </Button>
              ))}
            </div>

            {/* Info explicative */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              {downloadLimit >= 999 
                ? "L'acheteur pourra télécharger ce fichier sans limite" 
                : `L'acheteur pourra télécharger ce fichier ${downloadLimit} fois maximum`
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
