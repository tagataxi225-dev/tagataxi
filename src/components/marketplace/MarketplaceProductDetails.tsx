import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, Star, ShoppingCart, Heart, Share2,
  MessageCircle, ShieldCheck, Truck, ChevronLeft,
  ChevronRight, Plus, Minus, Download, Zap, FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  rating: number;
  reviews: number;
  seller: string;
  sellerLogo?: string;
  category: string;
  description: string;
  specifications?: Record<string, string>;
  inStock: boolean;
  stockCount: number;
  brand?: string;
  condition?: string;
  is_digital?: boolean;
  digital_download_limit?: number;
}

interface MarketplaceProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: () => void;
  onStartChat: () => void;
  onCreateOrder: () => void;
}

export const MarketplaceProductDetails: React.FC<MarketplaceProductDetailsProps> = ({
  product,
  onBack,
  onAddToCart,
  onStartChat,
  onCreateOrder,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currency = (tz === 'Africa/Abidjan' || tz === 'Africa/Dakar' || tz === 'Africa/Accra')
    ? 'XOF' : 'CDF';
  const formatPrice = (p: number) => formatCurrency(p, currency);

  const productImages = product.images?.length ? product.images : [product.image];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const totalPrice = product.price * quantity;
  const isNew = product.condition === 'new' || product.condition === 'neuf';
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="flex flex-col h-full bg-white">

      {/* 1) Hero ─────────────────────────────────────────────────── */}
      <div className="relative h-72 bg-gray-100">
        <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Bouton retour */}
        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-800 active:scale-95 transition-transform"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Wishlist + Share */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            type="button"
            onClick={() => setIsWishlisted(v => !v)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center active:scale-95 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center active:scale-95 transition-transform"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Badge Vidéo */}
        {product.videoUrl && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
              📹 Vidéo
            </span>
          </div>
        )}
      </div>

      {/* 2) Contenu ──────────────────────────────────────────────── */}
      <div className="rounded-t-3xl bg-white -mt-8 relative z-10 flex-1 overflow-y-auto px-5 pt-6 pb-32">

        {/* Poignée */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-5" />

        {/* Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.inStock ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              En stock
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
              Rupture de stock
            </span>
          )}
          {isNew && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              Neuf
            </span>
          )}
          {product.is_digital && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1">
              <FileCode className="w-3 h-3" /> Digital
            </span>
          )}
          {product.brand && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {product.brand}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>

        {/* Prix + original barré */}
        <div className="flex items-baseline gap-3 mt-2">
          <p className="text-3xl font-black text-red-600">{formatPrice(product.price)}</p>
          {hasDiscount && (
            <p className="text-base font-medium text-gray-400 line-through">
              {formatPrice(product.originalPrice!)}
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
          <span className="text-sm text-gray-400">({product.reviews} avis)</span>
        </div>

        {/* Bannière Escrow */}
        <div className="mt-5 flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">Paiement sécurisé Escrow</p>
            <p className="text-xs text-green-700 mt-0.5">Votre argent est protégé jusqu'à la livraison</p>
          </div>
        </div>

        {/* Vendeur */}
        <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {product.sellerLogo ? (
              <img src={product.sellerLogo} alt={product.seller} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {product.seller.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{product.seller}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-500">Vendeur vérifié</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartChat}
            className="text-sm font-semibold text-red-600 active:scale-95 transition-transform shrink-0"
            style={{ touchAction: 'manipulation' }}
          >
            Voir la boutique →
          </button>
        </div>

        {/* Produit digital */}
        {product.is_digital && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900">Téléchargement instantané</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {product.digital_download_limit ?? 5} téléchargements inclus
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Livraison */}
        {!product.is_digital && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Truck className="w-4 h-4 text-primary" />
            <span>Livraison rapide disponible</span>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Spécifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Caractéristiques</h3>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {Object.entries(product.specifications).map(([key, value], idx, arr) => (
                <div
                  key={key}
                  className={`flex justify-between items-center px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-sm text-gray-500">{key}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3) Barre fixe bas ───────────────────────────────────────── */}
      {(product.inStock || product.is_digital) && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          {/* Compteur - N + */}
          {!product.is_digital && (
            <div className="flex items-center bg-gray-100 rounded-2xl h-14 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-11 h-14 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                style={{ touchAction: 'manipulation' }}
              >
                <Minus className="h-4 w-4 text-gray-700" />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={quantity}
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="text-base font-bold w-6 text-center text-gray-900 tabular-nums"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(product.stockCount, q + 1))}
                disabled={quantity >= product.stockCount}
                className="w-11 h-14 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          )}

          {/* Bouton Ajouter / Acheter */}
          <button
            type="button"
            onClick={product.is_digital ? onCreateOrder : onAddToCart}
            className="flex-1 h-14 rounded-2xl bg-red-600 active:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
            style={{ touchAction: 'manipulation' }}
          >
            {product.is_digital ? (
              <>
                <Download className="w-5 h-5" />
                Acheter · {formatPrice(product.price)}
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Ajouter · {formatPrice(totalPrice)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
