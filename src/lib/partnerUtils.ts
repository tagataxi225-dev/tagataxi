/**
 * Utilitaires pour les partenaires Tembea
 */

/**
 * Formate un montant en devise locale (CDF ou XOF)
 */
export const formatPartnerCurrency = (
  amount: number, 
  currency: string = 'XOF',
  showSymbol: boolean = true
): string => {
  const formatted = new Intl.NumberFormat('fr-CD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));

  return showSymbol ? `${formatted} ${currency}` : formatted;
};

/**
 * Calcule le pourcentage de variation entre deux valeurs
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Formate une date relative (ex: "il y a 2h")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins}min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays}j`;
  
  return past.toLocaleDateString('fr-FR');
};

/**
 * Convertit un statut en label français
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'En attente',
    'accepted': 'Accepté',
    'in_progress': 'En cours',
    'completed': 'Complété',
    'cancelled': 'Annulé',
    'rejected': 'Rejeté',
    'active': 'Actif',
    'inactive': 'Inactif',
    'verified': 'Vérifié',
    'processing': 'En traitement',
    'paid': 'Payé',
    'failed': 'Échoué'
  };
  
  return labels[status] || status;
};
