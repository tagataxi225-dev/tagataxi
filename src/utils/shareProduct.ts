/**
 * Utilitaire centralisé de partage de produits/plats
 * Web Share API avec fallback cascade: natif → clipboard → prompt
 */
import { toast } from 'sonner';
import { formatCurrency, type Currency } from '@/utils/formatCurrency';
import { getProductUrl, getRestaurantUrl } from '@/config/appUrl';

interface ShareProductOptions {
  title: string;
  price: number;
  currency: Currency;
  productId: string;
  productType: 'product' | 'dish';
  vendorId?: string;
}

/**
 * Fallback: copie dans le presse-papier
 * Retourne true si réussi
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  // Méthode 1: Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue vers fallback
    }
  }

  // Méthode 2: execCommand fallback (anciens navigateurs / iframes)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

export const shareProduct = async ({
  title,
  price,
  currency,
  productId,
  productType,
  vendorId,
}: ShareProductOptions): Promise<void> => {
  const shareUrl = productType === 'dish'
    ? getRestaurantUrl(vendorId || productId)
    : getProductUrl(productId);

  const formattedPrice = formatCurrency(price, currency);
  const shareText = `${title} — ${formattedPrice}`;
  const fullText = `${shareText}\n${shareUrl}`;

  // 1) Essai partage natif
  if (navigator.share) {
    const shareData: ShareData = {
      title: `${title} sur Tembea`,
      text: shareText,
      url: shareUrl,
    };

    // Vérifier canShare si disponible
    const canShare = !navigator.canShare || navigator.canShare(shareData);

    if (canShare) {
      try {
        await navigator.share(shareData);
        return; // Succès natif, on sort
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // Annulation utilisateur
        // NotAllowedError ou autre → on continue vers fallback
        console.warn('[Share] Natif échoué, fallback clipboard:', err?.name);
      }
    }
  }

  // 2) Fallback clipboard
  const copied = await copyToClipboard(fullText);
  if (copied) {
    toast.success('Lien copié dans le presse-papier !');
    return;
  }

  // 3) Fallback final: prompt
  try {
    window.prompt('Copiez ce lien pour partager :', shareUrl);
  } catch {
    toast.error('Impossible de partager');
  }
};
