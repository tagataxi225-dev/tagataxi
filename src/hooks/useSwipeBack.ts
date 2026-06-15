import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from './useHapticFeedback';

const EDGE_ZONE = 25; // px from left edge
const THRESHOLD_RATIO = 0.3; // 30% of screen width
const VELOCITY_THRESHOLD = 0.4; // px/ms
const MAIN_DASHBOARDS = [
  '/',
  '/app',
  '/app/client',
  '/app/driver',
  '/app/partner',
  '/app/admin',
  '/app/restaurant',
  '/landing',
];

interface SwipeBackState {
  active: boolean;
  offsetX: number;
  progress: number; // 0-1
}

export const useSwipeBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerHaptic } = useHapticFeedback();

  const [state, setState] = useState<SwipeBackState>({ active: false, offsetX: 0, progress: 0 });

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const activeRef = useRef(false);
  const lockedRef = useRef(false); // locked to horizontal after initial move
  const triggeredHapticRef = useRef(false);

  const isDisabled = useCallback(() => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    if (MAIN_DASHBOARDS.includes(path)) return true;
    // Disable if a drawer/modal is open (check for radix overlay or vaul)
    if (document.querySelector('[data-state="open"][role="dialog"]')) return true;
    if (document.querySelector('[vaul-drawer]')) return true;
    return false;
  }, [location.pathname]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isDisabled()) return;
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE) return;

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();
      activeRef.current = true;
      lockedRef.current = false;
      triggeredHapticRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!activeRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // First significant move: decide if horizontal or vertical
      if (!lockedRef.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // too small
        if (Math.abs(dy) > Math.abs(dx) * 1.2) {
          // Vertical scroll — abort
          activeRef.current = false;
          setState({ active: false, offsetX: 0, progress: 0 });
          return;
        }
        lockedRef.current = true;
      }

      if (dx < 0) {
        setState({ active: false, offsetX: 0, progress: 0 });
        return;
      }

      const screenW = window.innerWidth;
      const progress = Math.min(dx / (screenW * THRESHOLD_RATIO), 1);
      
      // Haptic at threshold
      if (progress >= 1 && !triggeredHapticRef.current) {
        triggeredHapticRef.current = true;
        triggerHaptic('medium');
      }
      if (progress < 1) {
        triggeredHapticRef.current = false;
      }

      e.preventDefault();
      setState({ active: true, offsetX: dx, progress });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!activeRef.current || !lockedRef.current) {
        activeRef.current = false;
        setState({ active: false, offsetX: 0, progress: 0 });
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startXRef.current;
      const dt = Date.now() - startTimeRef.current;
      const velocity = dx / Math.max(dt, 1);
      const screenW = window.innerWidth;

      activeRef.current = false;

      if (dx > screenW * THRESHOLD_RATIO || velocity > VELOCITY_THRESHOLD) {
        triggerHaptic('light');
        setState({ active: false, offsetX: 0, progress: 0 });
        navigate(-1);
      } else {
        setState({ active: false, offsetX: 0, progress: 0 });
      }
    };

    const handleTouchCancel = () => {
      activeRef.current = false;
      setState({ active: false, offsetX: 0, progress: 0 });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isDisabled, navigate, triggerHaptic]);

  return state;
};
