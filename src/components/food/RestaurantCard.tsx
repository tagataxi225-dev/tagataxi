import { motion } from 'framer-motion';
import type { Restaurant } from '@/types/food';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { useState } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import { Star, Clock, Heart, Zap, Tag, MapPin } from 'lucide-react';

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  showCityBadge?: boolean;
}

export const RestaurantCard = ({ restaurant, onClick, showCityBadge }: RestaurantCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(restaurant.id);
  const currency = getCurrencyByCity(restaurant.city || '');
  const rating = restaurant.rating_average || 4.2;
  const prepTime = restaurant.average_preparation_time || 25;
  const isOpen = (restaurant as any).is_open !== false;
  const minOrder = restaurant.minimum_order_amount;

  const handleFav = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    toggleFavorite({ id: restaurant.id, name: restaurant.restaurant_name, price: 0, image: restaurant.banner_url || '', seller: restaurant.restaurant_name, sellerId: restaurant.id, category: 'restaurant', rating });
  };

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ fontFamily: F, cursor: 'pointer', borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', width: '100%', position: 'relative' }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 164, background: '#F2F2F7', overflow: 'hidden' }}>
        {!imgLoaded && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#F2F2F7 25%,#E5E5EA 50%,#F2F2F7 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <img src={restaurant.banner_url ? `${restaurant.banner_url}?t=${restaurant.updated_at}` : '/placeholder-food.jpg'} alt={restaurant.restaurant_name} loading="lazy" onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />

        {/* Logo */}
        {restaurant.logo_url && (
          <div style={{ position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          </div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, right: 46, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {prepTime <= 20 && (
            <div style={{ background: '#FF9F0A', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Zap size={10} color="#fff" fill="#fff" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>Rapide</span>
            </div>
          )}
          {!isOpen && (
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '4px 10px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Fermé</span>
            </div>
          )}
        </div>

        {/* Fav */}
        <motion.button type="button" onClick={handleFav} onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleFav(e); }}
          whileTap={{ scale: 0.7 }}
          style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', zIndex: 10 }}>
          <Heart size={15} fill={isFav ? '#E8353B' : 'none'} color={isFav ? '#E8353B' : '#fff'} />
        </motion.button>

        {/* Name */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{restaurant.restaurant_name}</p>
        </div>
      </div>

      {/* Info row */}
      <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={12} fill="#FF9F0A" color="#FF9F0A" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E' }}>{rating.toFixed(1)}</span>
          </div>
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#8E8E93' }}>
            <Clock size={11} color="#8E8E93" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#636366' }}>{prepTime}-{prepTime + 10} min</span>
          </div>
          {showCityBadge && restaurant.city && (
            <><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapPin size={10} color="#8E8E93" />
              <span style={{ fontSize: 11, color: '#636366', fontWeight: 500 }}>{restaurant.city}</span>
            </div></>
          )}
        </div>
        {minOrder && (
          <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, flexShrink: 0 }}>
            Min. {formatCurrency(minOrder, currency)}
          </span>
        )}
      </div>
    </motion.div>
  );
};
