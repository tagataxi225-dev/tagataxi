import { useState, useCallback } from 'react';
import { invokeEdgeFunction } from '@/utils/edgeFunctionWrapper';

interface RecipientInfo {
  valid: boolean;
  user_id?: string;
  display_name?: string;
  phone_number?: string;
  error?: string;
}

export const useRecipientValidation = () => {
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateRecipient = useCallback((input: string) => {
    // Clear previous timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Reset states
    setError(null);
    setRecipientInfo(null);

    // Ne valide pas si input vide ou trop court
    if (!input || input.trim().length < 3) {
      return;
    }

    setIsValidating(true);

    // Debounce: valide après 800ms
    const timeout = setTimeout(async () => {
      try {
        const { data, error: funcError } = await invokeEdgeFunction({
          functionName: 'validate-transfer-recipient',
          body: { identifier: input.trim() }
        });

        if (funcError) {
          console.error('Erreur validation:', funcError);
          setError('Erreur lors de la validation');
          setRecipientInfo({ valid: false, error: 'Erreur de validation' });
          setIsValidating(false);
          return;
        }

        if (data?.success && data?.valid) {
          setRecipientInfo({
            valid: true,
            user_id: data.recipientId,
            display_name: data.recipientName,
            phone_number: data.recipientEmail // Utiliser l'email comme identifiant
          });
          setError(null);
        } else {
          setError(data?.error || 'Destinataire invalide');
          setRecipientInfo({ valid: false, error: data?.error });
        }

        setIsValidating(false);
      } catch (err: any) {
        console.error('Erreur validation:', err);
        setError('Erreur de connexion');
        setRecipientInfo({ valid: false, error: 'Erreur de connexion' });
        setIsValidating(false);
      }
    }, 800);

    setValidationTimeout(timeout);
  }, [validationTimeout]);

  const clearValidation = useCallback(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    setRecipientInfo(null);
    setError(null);
    setIsValidating(false);
  }, [validationTimeout]);

  return {
    recipientInfo,
    isValidating,
    error,
    validateRecipient,
    clearValidation
  };
};
