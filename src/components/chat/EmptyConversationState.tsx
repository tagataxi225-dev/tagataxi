import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatUserRole = 'buyer' | 'vendor' | 'driver' | 'support';
export type ChatContextType = 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';

interface EmptyConversationStateProps {
  participantName?: string;
  onSendQuickMessage: (message: string) => void;
  contextType?: ChatContextType;
  userRole?: ChatUserRole;
}

interface Suggestion {
  emoji: string;
  text: string;
}

const SUGGESTIONS_MAP: Record<string, Record<string, Suggestion[]>> = {
  marketplace: {
    buyer: [
      { emoji: '👋', text: 'Bonjour, ce produit est-il toujours disponible ?' },
      { emoji: '💰', text: 'Quel est votre meilleur prix ?' },
      { emoji: '🚚', text: 'Livrez-vous à domicile ?' },
    ],
    vendor: [
      { emoji: '👋', text: 'Bonjour ! Comment puis-je vous aider ?' },
      { emoji: '✅', text: 'Le produit est disponible' },
      { emoji: '🎁', text: 'Offre spéciale pour vous' },
    ],
  },
  delivery: {
    buyer: [
      { emoji: '📍', text: 'Où en est ma livraison ?' },
      { emoji: '⏱️', text: 'Dans combien de temps ?' },
      { emoji: '🏠', text: 'Je suis à l\'adresse indiquée' },
    ],
    driver: [
      { emoji: '📦', text: 'J\'ai récupéré votre colis' },
      { emoji: '🚗', text: 'Je suis en route' },
      { emoji: '⏱️', text: 'J\'arrive dans 5 minutes' },
    ],
  },
  transport: {
    buyer: [
      { emoji: '📍', text: 'Où êtes-vous exactement ?' },
      { emoji: '⏱️', text: 'Dans combien de temps ?' },
      { emoji: '🏠', text: 'Je suis au point de rendez-vous' },
    ],
    driver: [
      { emoji: '🚗', text: 'Je suis en route vers vous' },
      { emoji: '⏱️', text: 'J\'arrive dans 5 minutes' },
      { emoji: '📍', text: 'Je suis arrivé' },
    ],
  },
  support: {
    buyer: [
      { emoji: '❓', text: 'Problème avec ma commande' },
      { emoji: '💳', text: 'Question sur le paiement' },
      { emoji: '🆘', text: 'J\'ai besoin d\'aide' },
    ],
  },
};

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { emoji: '👋', text: 'Bonjour !' },
  { emoji: '❓', text: 'J\'ai une question' },
  { emoji: '🆘', text: 'J\'ai besoin d\'aide' },
];

const WELCOME_TEXT: Record<string, Record<string, string>> = {
  marketplace: {
    buyer: 'Envoyez un message pour démarrer la négociation',
    vendor: 'Répondez à votre client',
  },
  delivery: {
    buyer: 'Contactez votre livreur',
    driver: 'Contactez votre client',
  },
  transport: {
    buyer: 'Contactez votre chauffeur',
    driver: 'Contactez votre passager',
  },
  support: {
    buyer: 'Décrivez votre problème',
  },
};

const getSuggestions = (contextType?: ChatContextType, userRole?: ChatUserRole): Suggestion[] => {
  if (contextType && userRole && SUGGESTIONS_MAP[contextType]?.[userRole]) {
    return SUGGESTIONS_MAP[contextType][userRole];
  }
  if (contextType && SUGGESTIONS_MAP[contextType]) {
    const roles = Object.keys(SUGGESTIONS_MAP[contextType]);
    if (roles.length > 0) return SUGGESTIONS_MAP[contextType][roles[0]];
  }
  return DEFAULT_SUGGESTIONS;
};

const getWelcomeText = (contextType?: ChatContextType, userRole?: ChatUserRole): string => {
  if (contextType && userRole && WELCOME_TEXT[contextType]?.[userRole]) {
    return WELCOME_TEXT[contextType][userRole];
  }
  return 'Envoyez un message pour démarrer';
};

export const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  participantName = 'le vendeur',
  onSendQuickMessage,
  contextType,
  userRole
}) => {
  const suggestions = getSuggestions(contextType, userRole);
  const welcomeText = getWelcomeText(contextType, userRole);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-6 px-4 text-center"
    >
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="mb-4"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "bg-muted/50"
        )}>
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-1 mb-5"
      >
        <h4 className="font-medium text-base text-foreground">
          {userRole === 'vendor' ? `Répondez à ${participantName}` : `Discutez avec ${participantName}`}
        </h4>
        <p className="text-xs text-muted-foreground">
          {welcomeText}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-2 max-w-[360px]"
      >
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.04 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-3 py-1.5 h-auto text-xs hover:bg-muted/50 hover:border-border transition-all"
              onClick={() => onSendQuickMessage(suggestion.text)}
            >
              <span className="mr-1.5">{suggestion.emoji}</span>
              <span>{suggestion.text}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
