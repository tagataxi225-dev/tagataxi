import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, Sparkles, Check, Clock, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, differenceInHours, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface ScratchCardGridItemProps {
  card: {
    id: string;
    prize_value: number;
    currency: string;
    reward_type: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    scratch_revealed_at: string | null;
    scratch_percentage: number;
    created_at: string;
    expires_in_hours?: number;
    prize_details?: { name?: string };
    is_partner_prize?: boolean;
    partner_prize?: {
      name: string;
      partner_name: string;
      image_url?: string;
    };
  };
  onScratch: (cardId: string, percentage: number) => void;
  onReveal: (cardId: string) => void;
}

const getRarityConfig = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return {
        bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
        border: 'border-amber-300/60',
        accent: 'text-amber-600',
        glowClass: 'rarity-glow-legendary',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
        badgeText: 'text-white',
        label: '⭐ Légendaire',
        iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
      };
    case 'epic':
      return {
        bg: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50',
        border: 'border-violet-300/60',
        accent: 'text-violet-600',
        glowClass: 'rarity-glow-epic',
        badgeBg: 'bg-gradient-to-r from-violet-500 to-purple-500',
        badgeText: 'text-white',
        label: '💎 Épique',
        iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
      };
    case 'rare':
      return {
        bg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50',
        border: 'border-blue-300/60',
        accent: 'text-blue-600',
        glowClass: 'rarity-glow-rare',
        badgeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        badgeText: 'text-white',
        label: '🔷 Rare',
        iconBg: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
        border: 'border-slate-200/60',
        accent: 'text-slate-600',
        glowClass: 'rarity-glow-common',
        badgeBg: 'bg-slate-200',
        badgeText: 'text-slate-700',
        label: 'Commun',
        iconBg: 'bg-gradient-to-br from-slate-300 to-gray-400',
      };
  }
};

const getRewardIcon = (rewardType: string) => {
  switch (rewardType) {
    case 'xp_points': return <Star className="h-4 w-4" />;
    case 'boost_2x':
    case 'boost_3x': return <Sparkles className="h-4 w-4" />;
    case 'physical_gift': return <Gift className="h-4 w-4" />;
    case 'nothing': return <XCircle className="h-4 w-4" />;
    default: return <Gift className="h-4 w-4" />;
  }
};

const getTimeRemaining = (createdAt: string, expiresInHours: number = 24) => {
  const expiresAt = addHours(new Date(createdAt), expiresInHours);
  const now = new Date();
  if (now >= expiresAt) return { expired: true, text: 'Expiré' };
  const hoursLeft = differenceInHours(expiresAt, now);
  const daysLeft = differenceInDays(expiresAt, now);
  if (daysLeft > 0) return { expired: false, text: `${daysLeft}j` };
  if (hoursLeft > 0) return { expired: false, text: `${hoursLeft}h` };
  return { expired: false, text: '⚡' };
};

export const ScratchCardGridItem: React.FC<ScratchCardGridItemProps> = ({
  card,
  onScratch,
  onReveal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percentage, setPercentage] = useState(card.scratch_percentage || 0);
  const [isRevealed, setIsRevealed] = useState(!!card.scratch_revealed_at || percentage >= 50);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  const isAlreadyRevealed = !!card.scratch_revealed_at;
  const isLoss = card.reward_type === 'nothing';
  const timeInfo = getTimeRemaining(card.created_at, card.expires_in_hours);
  const config = getRarityConfig(card.rarity);

  // Initialize canvas with holographic surface
  useEffect(() => {
    if (!canvasRef.current || isAlreadyRevealed || isRevealed) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Holographic metallic base
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#B0B8C8');
    gradient.addColorStop(0.15, '#C8D0E0');
    gradient.addColorStop(0.3, '#D8C8D8');
    gradient.addColorStop(0.45, '#D0D8C8');
    gradient.addColorStop(0.6, '#C8D8E0');
    gradient.addColorStop(0.75, '#D8D0C8');
    gradient.addColorStop(1, '#B0B8C8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Brushed metal lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < rect.height; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 0.5);
      ctx.lineTo(rect.width, y + Math.random() * 0.5);
      ctx.stroke();
    }

    // Subtle rainbow/holographic bands
    const holoGradient = ctx.createLinearGradient(0, 0, rect.width, 0);
    holoGradient.addColorStop(0, 'rgba(255, 100, 100, 0.06)');
    holoGradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.06)');
    holoGradient.addColorStop(0.4, 'rgba(100, 255, 100, 0.06)');
    holoGradient.addColorStop(0.6, 'rgba(100, 200, 255, 0.06)');
    holoGradient.addColorStop(0.8, 'rgba(200, 100, 255, 0.06)');
    holoGradient.addColorStop(1, 'rgba(255, 100, 200, 0.06)');
    ctx.fillStyle = holoGradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Fine noise texture
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // No text on canvas - we overlay HTML text with CSS shimmer instead
  }, [isAlreadyRevealed, isRevealed]);

  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    
    const brushSize = 24;
    const gradient = ctx.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, brushSize);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (lastPosition.current) {
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }

    lastPosition.current = { x: canvasX, y: canvasY };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 64) {
      if (imageData.data[i] === 0) transparent++;
    }
    
    const newPercentage = (transparent / (imageData.data.length / 256)) * 100;
    setPercentage(newPercentage);
    onScratch(card.id, newPercentage);

    if (newPercentage >= 45 && !isRevealed) {
      setIsRevealed(true);
      onReveal(card.id);
      
      if (!isLoss) {
        confetti({
          particleCount: card.rarity === 'legendary' ? 80 : card.rarity === 'epic' ? 50 : 30,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#007FFF', '#F7D000', '#CE1126', '#22C55E'],
          gravity: 1.2,
        });
      }

      if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    }
  }, [isRevealed, card.id, card.rarity, onScratch, onReveal, isLoss]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAlreadyRevealed || timeInfo.expired) return;
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScratching || isAlreadyRevealed) return;
    e.preventDefault();
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAlreadyRevealed || timeInfo.expired) return;
    setIsScratching(true);
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching || isAlreadyRevealed) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  const formatValue = (value: number, currency: string) => {
    if (currency === 'XP') return `+${value} XP`;
    return `${value.toLocaleString('fr-CD')} ${currency}`;
  };

  const displayValue = isLoss 
    ? 'Dommage !' 
    : card.prize_details?.name || formatValue(card.prize_value, card.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        "relative rounded-2xl border-2 overflow-hidden",
        config.bg,
        config.border,
        !isAlreadyRevealed && !timeInfo.expired && config.glowClass,
        timeInfo.expired && "opacity-50 grayscale"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 relative z-20">
        {/* Icon circle */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md",
          isLoss ? 'bg-gray-400' : config.iconBg
        )}>
          {getRewardIcon(card.reward_type)}
        </div>

        {/* Status / Time badge */}
        {isAlreadyRevealed ? (
          isLoss ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
              <X className="h-2.5 w-2.5" /> Perdu
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
              <Check className="h-2.5 w-2.5" /> Gagné
            </div>
          )
        ) : timeInfo.expired ? (
          <div className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold">
            Expiré
          </div>
        ) : (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold"
          >
            <Clock className="h-2.5 w-2.5" />
            {timeInfo.text}
          </motion.div>
        )}
      </div>

      {/* Main scratch area */}
      <div 
        ref={containerRef}
        className={cn(
          "relative mx-2.5 mb-1 rounded-xl overflow-hidden",
          isAlreadyRevealed ? "aspect-[4/3]" : "aspect-[16/9]"
        )}
      >
        {/* Prize content underneath */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-white/50 to-white/30 dark:from-background/50 dark:to-background/30">
          <AnimatePresence mode="wait">
            {(isRevealed || isAlreadyRevealed) && (
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-3xl mb-1"
                >
                  {isLoss ? '😔' : '🎉'}
                </motion.div>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className={cn(
                    "font-black text-base",
                    isLoss ? 'text-muted-foreground' : config.accent
                  )}
                >
                  {displayValue}
                </motion.p>
                {card.is_partner_prize && card.partner_prize && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[10px] text-muted-foreground mt-1"
                  >
                    {card.partner_prize.partner_name}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Faded preview when not revealed */}
          {!isRevealed && !isAlreadyRevealed && (
            <div className="text-center opacity-15">
              <div className="text-2xl mb-1">{isLoss ? '❓' : '🎁'}</div>
              <p className="font-bold text-xs text-muted-foreground">???</p>
            </div>
          )}
        </div>

        {/* Scratch canvas */}
        <AnimatePresence>
          {!isRevealed && !isAlreadyRevealed && !timeInfo.expired && (
            <motion.div
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleEnd}
              />
              {/* Shimmer text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-shimmer-gold font-black text-sm tracking-wider">
                  ✨ GRATTEZ ICI ✨
                </span>
                <span className="finger-slide-anim text-[10px] text-gray-500/60 mt-1 font-medium">
                  👆 Glissez votre doigt
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated progress bar at bottom of scratch area */}
        {!isAlreadyRevealed && !isRevealed && percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 z-20">
            <motion.div
              className="h-full progress-bar-animated relative rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage * 2.2, 100)}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Rarity badge */}
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold",
          config.badgeBg,
          config.badgeText
        )}>
          {config.label}
        </span>

        <p className="text-[10px] text-muted-foreground font-medium">
          {isAlreadyRevealed 
            ? isLoss 
              ? 'Pas de chance'
              : `${format(new Date(card.scratch_revealed_at!), 'd MMM', { locale: fr })}`
            : 'Découvrez votre lot'
          }
        </p>
      </div>
    </motion.div>
  );
};
