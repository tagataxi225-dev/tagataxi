import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface ProductInfoCardProps {
  title: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  stockCount: number;
  brand?: string;
  discount?: number;
  isDigital?: boolean;
  digitalFileName?: string;
  digitalFileSize?: number;
  digitalDownloadLimit?: number;
  digitalFileType?: string;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  title,
  category,
  condition,
  description,
  price,
  rating,
  reviewCount,
  stockCount,
  brand,
  discount = 0,
  isDigital = false,
  digitalFileName,
  digitalFileSize,
  digitalDownloadLimit = 5,
  digitalFileType
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatPrice = (amount: number) => formatCurrency(amount, 'CDF');

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (type?: string) => {
    if (!type) return null;
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR',
      'audio/mpeg': 'MP3',
      'video/mp4': 'MP4',
      'image/jpeg': 'JPG',
      'image/png': 'PNG'
    };
    return typeMap[type] || type.split('/').pop()?.toUpperCase() || 'Fichier';
  };

  const originalPrice = discount > 0 ? price / (1 - discount / 100) : null;

  const conditionLabels: Record<string, string> = {
    new: 'Neuf',
    like_new: 'Comme neuf',
    good: 'Bon état',
    fair: 'État correct',
    refurbished: 'Reconditionné'
  };

  return (
    <div className="space-y-3 lg:rounded-xl lg:border lg:bg-card lg:p-4">
      {/* Title */}
      <h2 className="text-lg font-semibold leading-tight line-clamp-2">
        {title}
      </h2>
      
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isDigital ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
            <Download className="h-3 w-3" />
            Digital
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
            {conditionLabels[condition] || condition}
          </span>
        )}
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {category}
        </span>
        {discount > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
            -{discount}%
          </span>
        )}
        {!isDigital && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            stockCount > 5 
              ? 'bg-emerald-500/10 text-emerald-600' 
              : stockCount > 0 
                ? 'bg-orange-500/10 text-orange-600' 
                : 'bg-destructive/10 text-destructive'
          }`}>
            {stockCount > 0 ? `${stockCount} en stock` : 'Rupture'}
          </span>
        )}
      </div>

      {/* Digital file info */}
      {isDigital && (
        <div className="flex items-center gap-3 p-2.5 bg-blue-500/5 rounded-lg text-sm">
          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {digitalFileType && (
              <span className="font-medium text-blue-600">{getFileTypeLabel(digitalFileType)}</span>
            )}
            {digitalFileSize && (
              <span className="text-muted-foreground">{formatFileSize(digitalFileSize)}</span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-blue-600">{digitalDownloadLimit} téléchargements</span>
          </div>
        </div>
      )}

      {/* Rating — hidden when 0 */}
      {rating > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star 
                key={i} 
                className={`h-3.5 w-3.5 ${
                  i <= Math.floor(rating) 
                    ? 'fill-yellow-500 text-yellow-500' 
                    : 'text-muted-foreground/30'
                }`} 
              />
            ))}
          </div>
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs">({reviewCount} avis)</span>
        </div>
      )}
      
      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-primary">
          {formatPrice(price)}
        </span>
        {originalPrice && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
      
      {/* Description — expandable on mobile */}
      <div className="lg:hidden">
        <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
          {description}
        </p>
        {description.length > 100 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary mt-1"
          >
            {expanded ? (
              <>Voir moins <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Voir plus <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
