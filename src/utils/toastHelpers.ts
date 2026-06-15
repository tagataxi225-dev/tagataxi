/**
 * Toast helpers centralisés avec support i18n
 * Utiliser ces helpers pour remplacer progressivement les toast hardcodés
 */
import { toast } from 'sonner';

type TranslationFn = (key: string, params?: Record<string, any>) => string;

/**
 * Toast d'erreur avec titre traduit automatiquement
 */
export const toastError = (t: TranslationFn, description: string) => {
  toast.error(description);
};

/**
 * Toast de succès avec titre traduit automatiquement
 */
export const toastSuccess = (t: TranslationFn, description: string) => {
  toast.success(description);
};

/**
 * Toast d'avertissement avec titre traduit automatiquement
 */
export const toastWarning = (t: TranslationFn, description: string) => {
  toast.warning(description);
};

/**
 * Toast d'info avec titre traduit automatiquement
 */
export const toastInfo = (t: TranslationFn, description: string) => {
  toast.info(description);
};
