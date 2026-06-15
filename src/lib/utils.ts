import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'CDF'): string {
  if (currency === 'CDF') {
    return new Intl.NumberFormat('fr-CD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' CDF';
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

/**
 * Détermine si une transaction est un crédit (positif) ou un débit (négatif)
 */
export function isTransactionCredit(transactionType: string): boolean {
  return ['credit', 'transfer_in', 'top_up', 'refund', 'bonus'].includes(transactionType);
}

/**
 * Convertit un transaction_type en type simplifié credit/debit
 */
export function normalizeTransactionType(transactionType: string): 'credit' | 'debit' {
  return isTransactionCredit(transactionType) ? 'credit' : 'debit';
}
