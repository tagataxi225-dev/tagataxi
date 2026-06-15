import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export interface ProductVideoPlayerHandle {
  play: () => void;
  pause: () => void;
}

interface ProductVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  aspectRatio?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ProductVideoPlayer = forwardRef<ProductVideoPlayerHandle, ProductVideoPlayerProps>(({
  src,
  poster,
  className,
  autoPlay = true,
  showControls = true,
  aspectRatio = 'aspect-[3/4]',
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isInViewport, setIsInViewport] = useState(false);
  const wasPlayingBeforeHidden = useRef(false);

  // Expose play/pause to parent
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    },
    pause: () => {
      videoRef.current?.pause();
      setIsPlaying(false);
    },
  }));

  // Lazy load + pause/resume on scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInViewport(visible);

        if (!visible && videoRef.current && !videoRef.current.paused) {
          wasPlayingBeforeHidden.current = true;
          videoRef.current.pause();
          setIsPlaying(false);
        } else if (visible && wasPlayingBeforeHidden.current && videoRef.current) {
          wasPlayingBeforeHidden.current = false;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }

        if (visible && !isLoaded) {
          setIsLoaded(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded]);

  // Auto-play when loaded and in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded || !autoPlay || !isInViewport) return;

    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [isLoaded, autoPlay, isInViewport]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      resetHideTimer();
    } else {
      setControlsVisible(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    }
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, [isPlaying, resetHideTimer]);

  // Video event handlers
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  // Controls
  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleContainerClick = useCallback(() => {
    if (controlsVisible && isPlaying) {
      // Tap while controls visible & playing → toggle play
      videoRef.current?.pause();
      setIsPlaying(false);
    } else if (!isPlaying) {
      videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      // Tap while controls hidden → show controls
      resetHideTimer();
    }
  }, [controlsVisible, isPlaying, resetHideTimer]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio * 100);
    setCurrentTime(video.currentTime);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl bg-muted select-none', aspectRatio, className)}
      onClick={handleContainerClick}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {isLoaded ? (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
          />

          {/* Controls overlay */}
          {showControls && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none',
                controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Central play/pause button */}
              <button
                onClick={togglePlay}
                className="pointer-events-auto absolute inset-0 flex items-center justify-center"
              >
                <div className={cn(
                  'w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-300',
                  isPlaying && controlsVisible ? 'scale-100 opacity-80' : !isPlaying ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                )}>
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </div>
              </button>

              {/* Bottom controls bar */}
              <div className="pointer-events-auto relative z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 pb-3 pt-8">
                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  className="w-full h-6 flex items-center cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div className="w-full h-[3px] bg-white/30 rounded-full overflow-hidden group-hover:h-[5px] transition-all">
                    <div
                      className="h-full bg-primary rounded-full transition-[width] duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Time + mute row */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-white/80 font-medium tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <button
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video badge */}
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[11px] font-medium text-white shadow-sm z-10">
            🎬 Vidéo
          </span>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

ProductVideoPlayer.displayName = 'ProductVideoPlayer';
