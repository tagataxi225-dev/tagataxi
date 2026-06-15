import { useState, useCallback } from 'react';

export type PopupType = 
  | 'ride_confirmation'
  | 'food_detail'
  | 'rental_confirmation'
  | 'lottery_reward'
  | 'payment'
  | 'promo'
  | 'onboarding'
  | null;

interface PopupState {
  type: PopupType;
  data: any;
}

export const usePopupManager = () => {
  const [activePopup, setActivePopup] = useState<PopupState>({ type: null, data: null });

  const showPopup = useCallback((type: PopupType, data?: any) => {
    setActivePopup({ type, data });
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup({ type: null, data: null });
  }, []);

  const isOpen = useCallback((type: PopupType) => {
    return activePopup.type === type;
  }, [activePopup.type]);

  return {
    activePopup: activePopup.type,
    popupData: activePopup.data,
    showPopup,
    hidePopup,
    isOpen
  };
};
