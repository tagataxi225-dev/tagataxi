/**
 * Animations d'effets pour le panier
 */

export const triggerAddToCartEffect = (productElement: HTMLElement) => {
  // Créer des particules animées
  const particles = 8;
  const rect = productElement.getBoundingClientRect();
  
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div');
    particle.className = 'cart-particle';
    
    // Angles aléatoires pour dispersion
    const angle = (Math.PI * 2 * i) / particles;
    const velocity = 50 + Math.random() * 50;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    particle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--orange-500)));
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      --tx: ${tx}px;
      --ty: ${ty}px;
      animation: particle-burst 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      box-shadow: 0 0 10px hsl(var(--primary) / 0.5);
    `;
    
    document.body.appendChild(particle);
    
    // Nettoyer après l'animation
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
};

export const triggerCheckoutConfetti = () => {
  // Animation de confetti (utilisera canvas-confetti dans le composant)
  return true;
};
