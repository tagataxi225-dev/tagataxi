import React, { useEffect, useRef } from 'react';

interface MeshPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  intensity: number;
}

interface DynamicMeshBackgroundProps {
  className?: string;
  density?: number;
  speed?: number;
}

const DynamicMeshBackground: React.FC<DynamicMeshBackgroundProps> = ({
  className = '',
  density = 12,
  speed = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<MeshPoint[]>([]);
  const animationFrameRef = useRef<number>();

  const congoColors = [
    'hsl(357, 95%, 55%)', // Congo Red Electric
    'hsl(42, 100%, 60%)', // Congo Yellow Electric
    'hsl(142, 85%, 45%)', // Congo Green Electric
    'hsl(220, 100%, 50%)', // Congo Blue Electric
    'hsl(357, 100%, 65%)', // Congo Red Vibrant
    'hsl(42, 100%, 70%)'   // Congo Yellow Vibrant
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createPoints = () => {
      pointsRef.current = [];
      for (let i = 0; i < density; i++) {
        pointsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          color: congoColors[Math.floor(Math.random() * congoColors.length)],
          intensity: Math.random() * 0.8 + 0.2
        });
      }
    };

    const drawMeshGradient = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create mesh gradient effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );

      pointsRef.current.forEach((point, index) => {
        const progress = index / pointsRef.current.length;
        const color = point.color.replace(')', `, ${point.intensity * 0.3})`).replace('hsl(', 'hsla(');
        gradient.addColorStop(progress, color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add flowing orbs
      pointsRef.current.forEach(point => {
        // Update position
        point.x += point.vx;
        point.y += point.vy;

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

        // Keep points in bounds
        point.x = Math.max(0, Math.min(canvas.width, point.x));
        point.y = Math.max(0, Math.min(canvas.height, point.y));

        // Create glowing orb
        const orbGradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, 150
        );

        const baseColor = point.color.replace(')', `, ${point.intensity})`).replace('hsl(', 'hsla(');
        const fadeColor = point.color.replace(')', ', 0)').replace('hsl(', 'hsla(');

        orbGradient.addColorStop(0, baseColor);
        orbGradient.addColorStop(0.6, point.color.replace(')', `, ${point.intensity * 0.3})`).replace('hsl(', 'hsla('));
        orbGradient.addColorStop(1, fadeColor);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Pulse effect
        point.intensity = 0.2 + 0.6 * (Math.sin(Date.now() * 0.001 + point.x * 0.01) + 1) / 2;
      });
    };

    const animate = () => {
      drawMeshGradient();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createPoints();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createPoints();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.6, mixBlendMode: 'screen' }}
    />
  );
};

export default DynamicMeshBackground;
