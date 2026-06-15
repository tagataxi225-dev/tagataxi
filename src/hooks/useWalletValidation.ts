import { useState, useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export const useWalletValidation = () => {
  const [amountError, setAmountError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateAmount = useCallback((amount: string): ValidationResult => {
    const numAmount = Number(amount);
    
    if (!amount || amount.trim() === '') {
      setAmountError('Veuillez entrer un montant');
      return { isValid: false, error: 'Veuillez entrer un montant' };
    }
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Montant invalide');
      return { isValid: false, error: 'Montant invalide' };
    }
    
    if (numAmount < 500) {
      setAmountError('Montant minimum: 500 CDF');
      return { isValid: false, error: 'Montant minimum: 500 CDF' };
    }
    
    if (numAmount > 1000000) {
      setAmountError('Montant maximum: 1,000,000 CDF');
      return { isValid: false, error: 'Montant maximum: 1,000,000 CDF' };
    }
    
    setAmountError(null);
    return { isValid: true, error: null };
  }, []);

  const validatePhone = useCallback((phone: string): ValidationResult => {
    if (!phone || phone.trim() === '') {
      setPhoneError('Veuillez entrer un numéro de téléphone');
      return { isValid: false, error: 'Veuillez entrer un numéro de téléphone' };
    }
    
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid DRC phone number (9 or 10 digits starting with 0)
    const phoneRegex = /^0[0-9]{8,9}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Format invalide (ex: 0991234567)');
      return { isValid: false, error: 'Format invalide (ex: 0991234567)' };
    }
    
    setPhoneError(null);
    return { isValid: true, error: null };
  }, []);

  const clearErrors = useCallback(() => {
    setAmountError(null);
    setPhoneError(null);
  }, []);

  return {
    validateAmount,
    validatePhone,
    clearErrors,
    amountError,
    phoneError
  };
};
