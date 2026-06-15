import { useState, useCallback } from 'react';

export const usePhoneValidation = () => {
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    // Format congolais : 0XXXXXXXXX (10 chiffres)
    const phoneRegex = /^0[0-9]{9}$/;
    const cleaned = phone.replace(/[\s\-]/g, '');
    
    if (!cleaned) {
      setPhoneError(null);
      setPhoneValid(false);
      return false;
    }
    
    const isValid = phoneRegex.test(cleaned);
    
    if (!isValid) {
      setPhoneError('Format invalide (ex: 0991234567)');
      setPhoneValid(false);
      return false;
    }
    
    setPhoneError(null);
    setPhoneValid(true);
    return true;
  }, []);
  
  const clearPhoneValidation = useCallback(() => {
    setPhoneError(null);
    setPhoneValid(false);
  }, []);
  
  return { phoneValid, phoneError, validatePhoneNumber, clearPhoneValidation };
};
