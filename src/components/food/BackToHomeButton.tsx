import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollDirection } from '@/hooks/useScrollDirection';

/**
 * FAB (Floating Action Button) pour retourner à l'accueil client
 * Apparaît intelligemment selon le scroll
 */
export const BackToHomeButton = () => {
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate('/app/client');
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ 
        scale: scrollDirection === 'down' ? 1 : 0.8,
        y: scrollDirection === 'down' ? 0 : 80
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="fixed bottom-24 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-2xl shadow-primary/30 md:hidden"
      aria-label="Retour à l'accueil"
    >
      <Home className="w-6 h-6" />
    </motion.button>
  );
};
