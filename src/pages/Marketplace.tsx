import React from 'react';
import { EnhancedMarketplaceInterface } from '@/components/marketplace/EnhancedMarketplaceInterface';
import { MarketplaceErrorBoundary } from '@/components/marketplace/MarketplaceErrorBoundary';
import { useNavigate } from 'react-router-dom';

const MarketplacePage = () => {
  const navigate = useNavigate();

  return (
    <MarketplaceErrorBoundary>
      <div className="h-screen h-dvh flex flex-col overflow-hidden bg-background">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto content-scrollable">
          <EnhancedMarketplaceInterface onNavigate={(path) => navigate(path)} />
        </main>
      </div>
    </MarketplaceErrorBoundary>
  );
};

export default MarketplacePage;