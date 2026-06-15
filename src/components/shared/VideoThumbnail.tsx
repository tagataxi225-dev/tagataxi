import { memo, useRef, useEffect } from 'react';

interface VideoThumbnailProps {
  src: string;
  className?: string;
}

export const VideoThumbnail = memo(({ src, className }: VideoThumbnailProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.play().catch(() => {}); }
      else { el.pause(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className={className || "w-full h-full object-cover"}
    />
  );
});

VideoThumbnail.displayName = 'VideoThumbnail';
