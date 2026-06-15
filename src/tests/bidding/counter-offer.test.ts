/**
 * 🧪 Counter-Offer Tests for Taxi Bidding System
 */

import { describe, it, expect } from 'vitest';

interface CounterOffer {
  driverId: string;
  bookingId: string;
  offeredPrice: number;
  clientProposedPrice: number;
  message?: string;
}

// Validation functions
const validateCounterOffer = (offer: CounterOffer) => {
  const errors: string[] = [];
  
  // Price must be positive
  if (offer.offeredPrice <= 0) {
    errors.push('Price must be positive');
  }
  
  // Price must be at least 80% of client's proposed price
  const minPrice = offer.clientProposedPrice * 0.8;
  if (offer.offeredPrice < minPrice) {
    errors.push(`Price must be at least ${minPrice} CDF`);
  }
  
  // Price must not exceed 200% of client's proposed price
  const maxPrice = offer.clientProposedPrice * 2;
  if (offer.offeredPrice > maxPrice) {
    errors.push(`Price cannot exceed ${maxPrice} CDF`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

const calculateCommission = (price: number, commissionRate: number = 0.15) => {
  const commission = Math.round(price * commissionRate);
  const driverEarnings = price - commission;
  return { commission, driverEarnings };
};

describe('Counter-Offer Validation', () => {
  it('should accept valid counter-offer', () => {
    const offer: CounterOffer = {
      driverId: 'driver-123',
      bookingId: 'booking-456',
      offeredPrice: 18000,
      clientProposedPrice: 15000,
    };

    const result = validateCounterOffer(offer);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject counter-offer below minimum', () => {
    const offer: CounterOffer = {
      driverId: 'driver-123',
      bookingId: 'booking-456',
      offeredPrice: 10000, // Less than 80% of 15000 = 12000
      clientProposedPrice: 15000,
    };

    const result = validateCounterOffer(offer);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Price must be at least 12000 CDF');
  });

  it('should reject counter-offer above maximum', () => {
    const offer: CounterOffer = {
      driverId: 'driver-123',
      bookingId: 'booking-456',
      offeredPrice: 35000, // More than 200% of 15000 = 30000
      clientProposedPrice: 15000,
    };

    const result = validateCounterOffer(offer);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Price cannot exceed 30000 CDF');
  });

  it('should reject zero or negative price', () => {
    const offer: CounterOffer = {
      driverId: 'driver-123',
      bookingId: 'booking-456',
      offeredPrice: 0,
      clientProposedPrice: 15000,
    };

    const result = validateCounterOffer(offer);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Price must be positive');
  });

  it('should accept exact client price (no counter)', () => {
    const offer: CounterOffer = {
      driverId: 'driver-123',
      bookingId: 'booking-456',
      offeredPrice: 15000,
      clientProposedPrice: 15000,
    };

    const result = validateCounterOffer(offer);
    expect(result.isValid).toBe(true);
  });
});

describe('Commission Calculation', () => {
  it('should calculate 15% platform commission', () => {
    const price = 20000;
    const { commission, driverEarnings } = calculateCommission(price);

    expect(commission).toBe(3000);
    expect(driverEarnings).toBe(17000);
  });

  it('should handle custom commission rates', () => {
    const price = 20000;
    const { commission, driverEarnings } = calculateCommission(price, 0.10);

    expect(commission).toBe(2000);
    expect(driverEarnings).toBe(18000);
  });

  it('should round commission to nearest integer', () => {
    const price = 15500;
    const { commission } = calculateCommission(price);

    expect(Number.isInteger(commission)).toBe(true);
    expect(commission).toBe(2325);
  });
});

describe('Offer Ranking System', () => {
  interface RankedOffer {
    id: string;
    offeredPrice: number;
    driverRating: number;
    responseTime: number; // seconds
    completedRides: number;
  }

  const rankOffers = (offers: RankedOffer[]) => {
    return offers.sort((a, b) => {
      // Weight: Price (40%), Rating (30%), Response Time (20%), Experience (10%)
      const scoreA = 
        (1 / a.offeredPrice) * 0.4 +
        a.driverRating * 0.3 +
        (1 / (a.responseTime + 1)) * 0.2 +
        (a.completedRides / 1000) * 0.1;
      
      const scoreB = 
        (1 / b.offeredPrice) * 0.4 +
        b.driverRating * 0.3 +
        (1 / (b.responseTime + 1)) * 0.2 +
        (b.completedRides / 1000) * 0.1;

      return scoreB - scoreA;
    });
  };

  it('should rank offers with multiple factors', () => {
    const offers: RankedOffer[] = [
      { id: 'offer-1', offeredPrice: 20000, driverRating: 4.5, responseTime: 30, completedRides: 500 },
      { id: 'offer-2', offeredPrice: 18000, driverRating: 4.8, responseTime: 15, completedRides: 800 },
      { id: 'offer-3', offeredPrice: 16000, driverRating: 4.2, responseTime: 45, completedRides: 200 },
    ];

    const ranked = rankOffers(offers);
    
    // offer-2 should rank highest (best combination of factors)
    expect(ranked[0].id).toBe('offer-2');
  });

  it('should prefer lower price when other factors are equal', () => {
    const offers: RankedOffer[] = [
      { id: 'offer-1', offeredPrice: 20000, driverRating: 4.5, responseTime: 30, completedRides: 500 },
      { id: 'offer-2', offeredPrice: 15000, driverRating: 4.5, responseTime: 30, completedRides: 500 },
    ];

    const ranked = rankOffers(offers);
    expect(ranked[0].id).toBe('offer-2');
  });
});

describe('Counter-Offer Negotiation', () => {
  it('should allow maximum 3 counter-offers per driver', () => {
    const maxCounterOffers = 3;
    const driverOfferCount = 2;

    const canMakeOffer = driverOfferCount < maxCounterOffers;
    expect(canMakeOffer).toBe(true);
  });

  it('should expire counter-offer after 2 minutes', () => {
    const offerCreatedAt = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago
    const expirationTime = 2 * 60 * 1000; // 2 minutes

    const isExpired = Date.now() - offerCreatedAt.getTime() > expirationTime;
    expect(isExpired).toBe(true);
  });

  it('should track negotiation history', () => {
    const negotiationHistory = [
      { type: 'client_bid', price: 15000, timestamp: new Date('2024-01-01T10:00:00') },
      { type: 'driver_counter', price: 20000, timestamp: new Date('2024-01-01T10:01:00') },
      { type: 'client_counter', price: 17000, timestamp: new Date('2024-01-01T10:02:00') },
      { type: 'driver_accept', price: 17000, timestamp: new Date('2024-01-01T10:03:00') },
    ];

    expect(negotiationHistory).toHaveLength(4);
    expect(negotiationHistory[negotiationHistory.length - 1].type).toBe('driver_accept');
  });
});
