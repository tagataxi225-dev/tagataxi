/**
 * Analytics pour le système de bidding
 * Track les événements clés pour améliorer l'expérience
 */

export const biddingAnalytics = {
  trackBiddingActivated: (bookingId: string, estimatedPrice: number) => {
    console.log('[Analytics] Bidding activated', { 
      bookingId, 
      estimatedPrice,
      timestamp: new Date().toISOString()
    });
  },
  
  trackOfferReceived: (bookingId: string, offerId: string, offeredPrice: number, estimatedPrice: number) => {
    const discount = ((estimatedPrice - offeredPrice) / estimatedPrice * 100).toFixed(1);
    console.log('[Analytics] Offer received', { 
      bookingId, 
      offerId, 
      offeredPrice,
      estimatedPrice,
      discount: `${discount}%`,
      timestamp: new Date().toISOString()
    });
  },
  
  trackOfferAccepted: (bookingId: string, offerId: string, savings: number) => {
    console.log('[Analytics] Offer accepted', { 
      bookingId, 
      offerId, 
      savings,
      savingsPercentage: `${savings > 0 ? '+' : ''}${savings.toFixed(1)}%`,
      timestamp: new Date().toISOString()
    });
  },
  
  trackBiddingExpired: (bookingId: string, offerCount: number) => {
    console.log('[Analytics] Bidding expired', { 
      bookingId, 
      offerCount,
      timestamp: new Date().toISOString()
    });
  },

  trackDriverNotified: (bookingId: string, driverCount: number, radius: number) => {
    console.log('[Analytics] Drivers notified for bidding', {
      bookingId,
      driverCount,
      searchRadius: `${radius}km`,
      timestamp: new Date().toISOString()
    });
  }
};
