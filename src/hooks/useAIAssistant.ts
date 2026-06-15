import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AIResponse {
  response: string;
  functionResult?: any;
  actionPerformed?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionResult?: any;
}

export const useAIAssistant = (context?: string) => {
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const { user } = useAuth();

  const sendMessage = async (message: string): Promise<AIResponse> => {
    setLoading(true);
    
    try {
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, userMessage]);

      // Prepare conversation history for API
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message,
          context,
          userId: user?.id,
          conversationHistory
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse: AIResponse = data;

      // Add AI response to conversation
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        functionResult: aiResponse.functionResult
      };

      setConversation(prev => [...prev, assistantMessage]);

      return aiResponse;
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: 'Désolé, je rencontre un problème technique. Veuillez réessayer.',
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const getQuickSuggestions = (context?: string): string[] => {
    const baseQuestions = [
      "Quel est le prix d'une course vers le centre-ville ?",
      "Quels sont les chauffeurs disponibles près de moi ?",
      "Recommande-moi des destinations populaires",
    ];

    const contextQuestions: Record<string, string[]> = {
      transport: [
        "Estime le prix pour aller à Gombe",
        "Trouve-moi un chauffeur VTC disponible",
        "Quels sont les types de véhicules disponibles ?",
        "Combien coûte un taxi-bus ?"
      ],
      delivery: [
        "Quel est le tarif pour une livraison express ?",
        "Combien de temps pour une livraison Flex ?",
        "Trouve-moi un livreur à moto disponible",
        "Tarifs pour un gros colis Maxicharge"
      ],
      marketplace: [
        "Cherche des smartphones Samsung",
        "Compare ces 2 produits pour moi",
        "Ce vendeur est-il fiable ?",
        "Vérifie si ce produit est en stock",
        "Calcule les frais de livraison",
        "Analyse cette image de produit"
      ],
      rental: [
        "Quels véhicules sont disponibles en location ?",
        "Prix de location d'une voiture par jour",
        "Partenaires de location à Kinshasa",
        "Conditions de location de véhicules"
      ],
      support: [
        "J'ai un problème avec ma commande",
        "Comment contacter le service client ?",
        "Annuler une réservation en cours",
        "Signaler un problème avec un chauffeur"
      ]
    };

    return context && contextQuestions[context] 
      ? contextQuestions[context] 
      : baseQuestions;
  };

  return {
    sendMessage,
    clearConversation,
    getQuickSuggestions,
    conversation,
    loading
  };
};