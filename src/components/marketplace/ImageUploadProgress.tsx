import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

export interface ImageUploadStatus {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface ImageUploadProgressProps {
  images: ImageUploadStatus[];
  onRemove: (index: number) => void;
  onRetry?: (index: number) => void;
}

export const ImageUploadProgress: React.FC<ImageUploadProgressProps> = ({
  images,
  onRemove,
  onRetry
}) => {
  if (images.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      <h4 className="text-sm font-medium">Images du produit ({images.length})</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <Card key={index} className="p-2 relative">
            {/* Preview Image */}
            <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2 relative">
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Status Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                {image.status === 'pending' && (
                  <div className="text-white text-xs">En attente</div>
                )}
                {image.status === 'uploading' && (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                )}
                {image.status === 'success' && (
                  <div className="bg-green-500 rounded-full p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                {image.status === 'error' && (
                  <div className="bg-red-500 rounded-full p-1">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(image.status === 'uploading' || image.status === 'pending') && (
              <Progress value={image.progress} className="h-1 mb-2" />
            )}

            {/* Error Message */}
            {image.status === 'error' && image.error && (
              <p className="text-xs text-destructive mb-2 line-clamp-2">
                {image.error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-1">
              {image.status === 'error' && onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(index)}
                  className="flex-1 h-7 text-xs"
                >
                  Réessayer
                </Button>
              )}
              {(image.status === 'pending' || image.status === 'error') && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
