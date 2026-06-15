import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'kwenda_shown_tips';

export const useSmartTips = () => {
  const [shownTips, setShownTips] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setShownTips(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shown tips:', error);
    }
  }, []);

  const shouldShowTip = useCallback((tipId: string) => {
    return !shownTips.includes(tipId);
  }, [shownTips]);

  const markTipAsShown = useCallback((tipId: string) => {
    setShownTips(prev => {
      const updated = [...prev, tipId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving tip:', error);
      }
      return updated;
    });
  }, []);

  const resetTips = useCallback(() => {
    setShownTips([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    shouldShowTip,
    markTipAsShown,
    resetTips
  };
};
