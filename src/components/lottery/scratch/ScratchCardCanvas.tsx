import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rarity, RARITY_CONFIG } from '@/types/scratch-card';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ScratchCardCanvasProps {
  width: number;
  height: number;
  rarity: Rarity;
  onScratch: (percentage: number) => void;
  onComplete: () => void;
  disabled?: boolean;
}

export const ScratchCardCanvas: React.FC<ScratchCardCanvasProps> = ({
  width,
  height,
  rarity,
  onScratch,
  onComplete,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const scratchedPixels = useRef(0);
  const totalPixels = useRef(0);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const particleId = useRef(0);

  // Créer la surface métallique holographique
  const createMetallicSurface = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Base gradient métallique premium
    const metalGradient = ctx.createLinearGradient(0, 0, w, h);
    metalGradient.addColorStop(0, '#E8E8EC');
    metalGradient.addColorStop(0.2, '#FAFAFA');
    metalGradient.addColorStop(0.4, '#D8D8DC');
    metalGradient.addColorStop(0.6, '#F5F5F7');
    metalGradient.addColorStop(0.8, '#E0E0E4');
    metalGradient.addColorStop(1, '#CFCFD5');

    // Dessiner avec coins arrondis
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fillStyle = metalGradient;
    ctx.fill();

    // Ajouter des reflets elliptiques lumineux
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radiusX = Math.random() * 80 + 40;
      const radiusY = Math.random() * 40 + 20;
      const rotation = Math.random() * Math.PI;
      
      ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + Math.random() * 0.12})`;
      ctx.fill();
      ctx.restore();
    }

    // Lignes subtiles de texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, 0);
      ctx.lineTo(Math.random() * w, h);
      ctx.stroke();
    }

    // Effet holographique subtil (reflets arc-en-ciel)
    const holoGradient = ctx.createLinearGradient(0, 0, w, h);
    holoGradient.addColorStop(0, 'rgba(255, 200, 200, 0.03)');
    holoGradient.addColorStop(0.25, 'rgba(255, 255, 200, 0.04)');
    holoGradient.addColorStop(0.5, 'rgba(200, 255, 200, 0.03)');
    holoGradient.addColorStop(0.75, 'rgba(200, 200, 255, 0.04)');
    holoGradient.addColorStop(1, 'rgba(255, 200, 255, 0.03)');
    
    ctx.fillStyle = holoGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fill();

    // Texte élégant "GRATTEZ ICI" avec effet doré
    ctx.save();
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ombre douce
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    
    // Texte avec couleur dorée/bronze
    ctx.fillStyle = 'rgba(160, 140, 100, 0.7)';
    ctx.fillText('✨ GRATTEZ ICI ✨', w / 2, h / 2);
    ctx.restore();

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Créer la surface métallique
    createMetallicSurface(ctx, width, height);

    // Calculate total pixels
    const imageData = ctx.getImageData(0, 0, width, height);
    totalPixels.current = imageData.data.length / 4;
  }, [width, height, createMetallicSurface]);

  // Créer des particules dorées au grattage
  const createScratchParticles = useCallback((x: number, y: number) => {
    const colors = ['#FFD700', '#FFA500', '#FFFFFF', '#FFE4B5', '#F0E68C'];
    const newParticles: Particle[] = Array.from({ length: 4 }, () => ({
      id: particleId.current++,
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 50,
      size: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles(prev => [...prev.slice(-25), ...newParticles]);
  }, []);

  // Grattage réaliste avec pinceau multi-points
  const scratch = useCallback((x: number, y: number) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';

    // Si on a une position précédente, créer une traînée fluide
    if (lastPosition.current) {
      const lastX = lastPosition.current.x;
      const lastY = lastPosition.current.y;
      
      // Traînée principale avec ligne épaisse
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(canvasX, canvasY);
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Points intermédiaires pour une traînée plus fluide
      const distance = Math.sqrt((canvasX - lastX) ** 2 + (canvasY - lastY) ** 2);
      const steps = Math.ceil(distance / 10);
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = lastX + (canvasX - lastX) * t;
        const py = lastY + (canvasY - lastY) * t;
        
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cercle principal (centre du doigt)
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Cercles secondaires pour effet doigt naturel
    const offsets = [
      { dx: -10, dy: -6, r: 14 },
      { dx: 10, dy: -6, r: 14 },
      { dx: -12, dy: 6, r: 12 },
      { dx: 12, dy: 6, r: 12 },
      { dx: 0, dy: -10, r: 10 },
    ];

    offsets.forEach(offset => {
      ctx.beginPath();
      ctx.arc(canvasX + offset.dx, canvasY + offset.dy, offset.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sauvegarder la position pour la traînée
    lastPosition.current = { x: canvasX, y: canvasY };

    // Créer des particules
    createScratchParticles(x - rect.left, y - rect.top);

    // Calculate percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }

    const percentage = (transparentPixels / totalPixels.current) * 100;
    scratchedPixels.current = transparentPixels;
    
    onScratch(percentage);

    // Auto-complete at 70%
    if (percentage >= 70) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onComplete();
    }
  }, [disabled, onScratch, onComplete, createScratchParticles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true);
    lastPosition.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    lastPosition.current = null;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isScratching) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  return (
    <div className="relative w-full h-full">
      {/* Canvas de grattage */}
      <canvas
        ref={canvasRef}
        className={`touch-none rounded-xl ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Shimmer overlay animé */}
      {!disabled && (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          <div className="scratch-surface-shimmer" />
        </div>
      )}

      {/* Particules dorées */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 0.5, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
