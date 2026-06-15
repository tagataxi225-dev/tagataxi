/**
 * AddToCartFeedback - Hook simplifié pour feedback d'ajout au panier
 * Style pro Tembea Food : pas de toast, pas de confetti, feedback sur bouton uniquement
 */

interface AddToCartFeedbackProps {
  onOpenCart?: () => void;
}

export const useAddToCartFeedback = ({ onOpenCart }: AddToCartFeedbackProps = {}) => {
  // Fonction principale - maintenant vide car feedback géré par AnimatedAddToCartButton
  const showFeedback = (
    product: { id: string; title: string; price: number; image: string },
    quantity: number = 1,
    options: {
      withAnimation?: boolean;
      withConfetti?: boolean;
      productElementSelector?: string;
      cartButtonSelector?: string;
    } = {}
  ) => {
    // Feedback géré localement par le bouton AnimatedAddToCartButton
    // Plus de toast, plus de confetti, plus d'animation flying
    console.log('✓ [Cart] Added:', product.title, 'x', quantity);
  };

  return { showFeedback };
};

// Hook simple conservé pour rétro-compatibilité
export const showSimpleAddToCartFeedback = (productName: string) => {
  console.log('✓ [Cart] Added:', productName);
};
