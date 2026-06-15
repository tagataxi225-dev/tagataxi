import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wifi, WifiOff, Image as ImageIcon, Download, Zap } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallback?: string;
}

interface ConnectionStatus {
  online: boolean;
  speed: 'fast' | 'slow' | 'offline';
  effectiveType: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  fallback = '/placeholder.svg'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {loading && (
        <div className="absolute inset-0 loading-shimmer rounded-lg flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      {inView && (
        <img
          src={error ? fallback : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
};

const ConnectionIndicator: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<ConnectionStatus>({
    online: navigator.onLine,
    speed: 'fast',
    effectiveType: ''
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection;
      const online = navigator.onLine;
      
      let speed: 'fast' | 'slow' | 'offline' = 'fast';
      let effectiveType = '';

      if (!online) {
        speed = 'offline';
      } else if (connection) {
        effectiveType = connection.effectiveType || '';
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          speed = 'slow';
        } else if (connection.effectiveType === '3g' || connection.downlink < 1.5) {
          speed = 'slow';
        }
      }

      setStatus({ online, speed, effectiveType });
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (status.speed) {
      case 'offline': return 'bg-destructive';
      case 'slow': return 'bg-congo-yellow';
      default: return 'bg-primary';
    }
  };

  const getStatusIcon = () => {
    return status.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!status.online) return t('common.offline');
    if (status.speed === 'slow') return 'Connexion lente';
    return 'Connexion rapide';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant="secondary" 
        className={`${getStatusColor()} text-white flex items-center space-x-1 transition-all duration-300`}
      >
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
    </div>
  );
};

interface ProgressiveLoaderProps {
  onRetry?: () => void;
  error?: boolean;
  message?: string;
}

const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({ 
  onRetry, 
  error = false, 
  message 
}) => {
  const { t } = useLanguage();

  if (error) {
    return (
      <Card className="cultural-card">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {message || 'Problème de connexion. Vérifiez votre réseau.'}
          </p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="touch-friendly">
              <Download className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cultural-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-medium">{t('common.loading')}</p>
              <p className="text-sm text-muted-foreground">
                {message || 'Optimisation pour votre connexion...'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full loading-shimmer"></div>
            <div className="h-3 bg-muted rounded-full loading-shimmer w-3/4"></div>
            <div className="h-3 bg-muted rounded-full loading-shimmer w-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DataCompressionHookReturn {
  compressData: (data: any) => string;
  decompressData: (compressed: string) => any;
  estimateSize: (data: any) => number;
}

export const useDataCompression = (): DataCompressionHookReturn => {
  const compressData = (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression: remove whitespace and common patterns
      return jsonString
        .replace(/\s+/g, '')
        .replace(/null/g, 'n')
        .replace(/true/g, 't')
        .replace(/false/g, 'f');
    } catch (error) {
      console.error('Compression error:', error);
      return JSON.stringify(data);
    }
  };

  const decompressData = (compressed: string): any => {
    try {
      const restored = compressed
        .replace(/n/g, 'null')
        .replace(/t/g, 'true')
        .replace(/f/g, 'false');
      return JSON.parse(restored);
    } catch (error) {
      console.error('Decompression error:', error);
      return compressed;
    }
  };

  const estimateSize = (data: any): number => {
    return new Blob([JSON.stringify(data)]).size;
  };

  return { compressData, decompressData, estimateSize };
};

export {
  OptimizedImage,
  ConnectionIndicator,
  ProgressiveLoader
};