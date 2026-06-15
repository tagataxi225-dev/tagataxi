import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2, VolumeX, Play, ThumbsUp, ThumbsDown, Share2, Store, ChevronRight, ShoppingCart } from 'lucide-react';
import { formatCurrency, type Currency } from '@/utils/formatCurrency';
import { shareProduct } from '@/utils/shareProduct';
import { useProductReactions } from '@/hooks/useProductReactions';

interface VideoFullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title: string;
  price: number;
  currency: Currency;
  productId?: string;
  productType?: 'product' | 'dish';
  images?: string[];
  onBuy?: () => void;
  shopName?: string;
  shopLogoUrl?: string;
  vendorId?: string;
}

export const VideoFullscreenDialog = memo(({
  open, onOpenChange, videoUrl, title, price, currency,
  productId, productType, images, onBuy,
  shopName, shopLogoUrl, vendorId,
}: VideoFullscreenDialogProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const reactType = productType === 'dish' ? 'food' : 'marketplace';
  const { counts, userReaction, toggleReaction } = useProductReactions(productId, reactType);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      setMuted(false);
      setPaused(false);
      setPreviewImage(null);
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [open]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) setProgress((currentTime / duration) * 100);
  }, []);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 0) setTranslateY(dy);
  }, [touchStartY]);

  const handleTouchEnd = useCallback(() => {
    if (translateY > 120) onOpenChange(false);
    setTranslateY(0);
    setTouchStartY(null);
  }, [translateY, onOpenChange]);

  const handleBuyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy) { onBuy(); return; }
    if (productId && productType === 'product') {
      onOpenChange(false);
      navigate(`/marketplace/product/${productId}`);
    }
  }, [onBuy, productId, productType, onOpenChange, navigate]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReaction('like');
  }, [toggleReaction]);

  const handleDislike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReaction('dislike');
  }, [toggleReaction]);

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId || isSharing) return;
    setIsSharing(true);
    try {
      await shareProduct({ title, price, currency, productId, productType: productType || 'product', vendorId });
    } finally {
      setTimeout(() => setIsSharing(false), 500);
    }
  }, [productId, productType, vendorId, title, price, currency, isSharing]);

  const handleShopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange(false);
    if (vendorId) {
      if (productType === 'dish') {
        navigate(`/food/restaurant/${vendorId}`);
      } else {
        navigate(`/marketplace/shop/${vendorId}`);
      }
    }
  }, [vendorId, productType, onOpenChange, navigate]);

  if (!open) return null;

  const filteredImages = (images || []).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[400] bg-black flex flex-col"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: translateY === 0 ? 'transform 0.2s ease' : 'none',
        opacity: 1 - translateY / 400,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag indicator + Stories progress bar */}
      <div className="flex flex-col items-center pt-3 pb-1 px-3 gap-2">
        <div className="w-10 h-1 rounded-full bg-white/30" />
        {!previewImage && (
          <div className="w-full h-[3px] bg-white/20 rounded-full cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full bg-white rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Close */}
      <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Video / Image preview */}
      <div className="flex-1 flex items-center justify-center relative" onClick={previewImage ? () => setPreviewImage(null) : togglePlay}>
        {previewImage ? (
          <img src={previewImage} alt={title} className="w-full h-full object-contain animate-in fade-in duration-500" />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                if (filteredImages.length > 0) {
                  setPreviewImage(filteredImages[0]);
                } else if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
              }}
            />
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right side action buttons — TikTok style */}
      <div className="absolute right-3 bottom-[220px] flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${userReaction === 'like' ? 'bg-primary text-primary-foreground scale-110' : 'bg-white/10 text-white'}`}>
            <ThumbsUp className="h-5 w-5" />
          </div>
          <span className="text-white text-[10px] font-semibold">{counts.likes}</span>
        </button>

        {/* Dislike */}
        <button onClick={handleDislike} className="flex flex-col items-center gap-0.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${userReaction === 'dislike' ? 'bg-destructive text-white scale-110' : 'bg-white/10 text-white'}`}>
            <ThumbsDown className="h-5 w-5" />
          </div>
          <span className="text-white text-[10px] font-semibold">{counts.dislikes}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Share2 className="h-5 w-5" />
          </div>
          <span className="text-white text-[10px] font-semibold">Partager</span>
        </button>

        {/* Mute */}
        <button onClick={toggleMute} className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </div>
          <span className="text-white text-[10px] font-semibold">{muted ? 'Son off' : 'Son'}</span>
        </button>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-16 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">

        {/* Image gallery */}
        {filteredImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
            {filteredImages.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setPreviewImage(previewImage === img ? null : img); }}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${previewImage === img ? 'border-primary scale-110' : 'border-white/20'}`}
              >
                <img src={img} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Vendor info */}
        {shopName && (
          <button
            onClick={vendorId ? handleShopClick : undefined}
            className="flex items-center gap-2 mb-2.5 group"
          >
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-white text-xs font-semibold group-hover:underline">{shopName}</span>
            {vendorId && <ChevronRight className="h-3.5 w-3.5 text-white/60" />}
          </button>
        )}

        {/* Title + Price */}
        <div className="mb-3">
          <p className="text-white text-sm font-bold truncate pr-14">{title}</p>
          <p className="text-primary text-base font-extrabold mt-0.5">{formatCurrency(price, currency)}</p>
        </div>

        {/* CTA Button */}
        {(productId || onBuy) && (
          <button
            onClick={handleBuyClick}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg"
          >
            <ShoppingCart className="h-4 w-4" />
            {productType === 'dish' ? 'Commander' : 'Acheter maintenant'}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

VideoFullscreenDialog.displayName = 'VideoFullscreenDialog';
