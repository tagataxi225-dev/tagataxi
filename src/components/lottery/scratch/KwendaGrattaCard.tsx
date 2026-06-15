import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Star, Zap, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TembeaGrattaWin, 
  CARD_TYPE_CONFIG, 
  REWARD_CONFIG 
} from '@/types/kwenda-gratta';
import { useGrattaSound } from '@/hooks/useGrattaSound';
import confetti from 'canvas-confetti';
import '@/styles/kwenda-gratta.css';

interface KwendaGrattaCardProps {
  card: TembeaGrattaWin;
  onScratch?: (percentage: number) => void;
  onReveal?: () => void;
}

export const KwendaGrattaCard: React.FC<KwendaGrattaCardProps> = ({
  card,
  onScratch,
  onReveal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(card.scratchPercentage || 0);
  const [revealed, setRevealed] = useState(!!card.scratchRevealedAt || scratchPercentage >= 70);
  const [showChing, setShowChing] = useState(false);
  const lastHapticProgress = useRef(0);

  const { playRevealFeedback, playScatchHaptic, playScratchSound } = useGrattaSound();
  
  const cardConfig = CARD_TYPE_CONFIG[card.cardType];
  const rewardConfig = REWARD_CONFIG[card.rewardCategory];

  // Initialiser le canvas de grattage
  useEffect(() => {
    if (revealed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Taille du canvas
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Dessiner le motif de grattage congolais
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#007FFF'); // Bleu RDC
    gradient.addColorStop(0.5, '#F7D000'); // Jaune RDC
    gradient.addColorStop(1, '#CE1126'); // Rouge RDC

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ajouter des motifs géométriques wax
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < canvas.width; i += 20) {
      for (let j = 0; j < canvas.height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Texte "GRATTE ICI" avec effet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆 GRATTE ICI', canvas.width / 2, canvas.height / 2);
  }, [revealed]);

  // Fonction de grattage avec haptics
  const scratch = useCallback((x: number, y: number) => {
    if (revealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Créer un effet de grattage réaliste
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Calculer le pourcentage gratté
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    const percentage = Math.round((transparent / (imageData.data.length / 4)) * 100);
    
    setScratchPercentage(percentage);
    onScratch?.(percentage);

    // Haptic feedback tous les 10% de progression
    if (percentage - lastHapticProgress.current >= 10) {
      lastHapticProgress.current = percentage;
      playScatchHaptic();
      playScratchSound();
    }

    // Révéler si > 70%
    if (percentage >= 70 && !revealed) {
      handleReveal();
    }
  }, [revealed, onScratch, playScatchHaptic, playScratchSound]);

  // Révéler la carte avec sons et haptics
  const handleReveal = async () => {
    setRevealed(true);
    setShowChing(true);
    onReveal?.();

    // Son "Ching!" + Haptic feedback
    await playRevealFeedback(card.cardType);

    // Animation "Ching!"
    setTimeout(() => setShowChing(false), 800);

    // Confetti aux couleurs RDC 🇨🇩
    const rdcColors = ['#007FFF', '#F7D000', '#CE1126'];
    
    confetti({
      particleCount: card.cardType === 'mega' ? 200 : card.cardType === 'rare' ? 120 : 60,
      spread: 80,
      origin: { y: 0.6 },
      colors: rdcColors,
      shapes: ['circle', 'square'],
      gravity: 0.8
    });

    // Double confetti pour Méga Carte
    if (card.cardType === 'mega') {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5, x: 0.3 },
          colors: rdcColors
        });
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5, x: 0.7 },
          colors: rdcColors
        });
      }, 300);
    }
  };

  // Gestion des événements tactiles
  const handleMouseDown = () => setIsScratching(true);
  const handleMouseUp = () => setIsScratching(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        'gratta-card',
        `gratta-card-${card.cardType}`,
        showChing && 'ching-animation'
      )}
    >
      <Card className={cn(
        'relative overflow-hidden border-2',
        cardConfig.borderColor,
        `bg-gradient-to-br ${cardConfig.bgGradient}`
      )}>
        {/* Badge type de carte */}
        <div className={cn('card-type-badge', `card-type-badge-${card.cardType}`)}>
          {cardConfig.emoji} {cardConfig.label}
        </div>

        {/* Badge carte du jour */}
        {card.isDailyCard && (
          <Badge 
            className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
          >
            <Gift className="h-3 w-3 mr-1" />
            Quotidienne
          </Badge>
        )}

        {/* Motif wax en fond */}
        <div className={cn('absolute inset-0', `wax-pattern-${card.cardType === 'mega' ? 'gold' : card.cardType === 'rare' ? 'purple' : card.cardType === 'active' ? 'green' : 'blue'}`)} />

        <CardContent className="p-4 relative z-10">
          {/* Zone de grattage avec glassmorphism */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* Glow effect autour de la zone */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-yellow-500/20 to-rose-500/20 rounded-3xl blur-lg opacity-60" />
            
            {/* Container glassmorphism */}
            <div className="relative bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Zone de grattage */}
              <div className="relative h-36 m-2 rounded-xl overflow-hidden bg-gradient-to-br from-card/90 to-card/70">
                <AnimatePresence mode="wait">
                  {!revealed ? (
                    <motion.div
                      key="scratch"
                      className="scratch-area absolute inset-0"
                      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 cursor-crosshair touch-none rounded-xl"
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
                        onTouchMove={handleTouchMove}
                      />
                      
                      {/* Contenu caché derrière */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
                        <span className="text-4xl">{rewardConfig.icon}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-4"
                    >
                      <motion.span
                        className="text-5xl mb-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        {rewardConfig.icon}
                      </motion.span>
                      
                      <h3 className={cn('font-bold text-lg', rewardConfig.colorClass)}>
                        {card.name}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground">
                        {rewardConfig.description}
                      </p>
                      
                      {card.value > 0 && (
                        <motion.div
                          className="mt-2 px-4 py-1 rounded-full bg-primary/10 font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          +{card.value} {card.rewardCategory === 'xp_points' ? 'XP' : card.currency}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Barre de progression modernisée */}
              {!revealed && (
                <div className="px-4 pb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      Progression
                    </span>
                    <span className="font-medium">{scratchPercentage}%</span>
                  </div>
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${scratchPercentage}%` }}
                      transition={{ type: 'spring', stiffness: 100 }}
                    />
                    {/* Shimmer effect sur la barre */}
                    <div className="absolute inset-0 scratch-progress-shimmer" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info expiration */}
          {card.expiresInHours && !revealed && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expire dans {card.expiresInHours}h</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animation Ching! overlay */}
      <AnimatePresence>
        {showChing && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <span className="text-6xl font-black text-yellow-500 drop-shadow-[0_0_30px_rgba(247,208,0,0.8)]">
              ✨
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
