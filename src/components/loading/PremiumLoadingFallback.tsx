import { InvisibleLoadingBar } from "./InvisibleLoadingBar";

interface PremiumLoadingFallbackProps {
  context?: 'client' | 'driver' | 'vendor' | 'admin' | 'default';
}

/**
 * ⚡ LOADING PREMIUM INVISIBLE
 * Remplacé par une barre discrète de 2px en haut
 * Plus de splash screen intrusif
 */
export const PremiumLoadingFallback = ({ context = 'default' }: PremiumLoadingFallbackProps) => {
  return <InvisibleLoadingBar />;
};
