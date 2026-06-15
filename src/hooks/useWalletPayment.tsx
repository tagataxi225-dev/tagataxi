import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook pour gérer les paiements avec portefeuille (bonus_balance et balance)
 * 
 * Règle : Le bonus_balance est utilisé EN PRIORITÉ, puis le balance complète
 * Paiement mixte : bonus d'abord, puis solde principal pour le reste
 */
export const useWalletPayment = () => {
  
  /**
   * Effectue un paiement en utilisant le portefeuille de l'utilisateur
   * Priorité : bonus_balance d'abord (même partiel), puis balance principal
   */
  const payWithWallet = async (
    userId: string,
    amount: number,
    description: string,
    referenceType: string,
    referenceId: string
  ) => {
    try {
      // Récupérer le wallet
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        throw new Error('Portefeuille introuvable');
      }

      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);
      const totalAvailable = bonusBalance + mainBalance;

      if (totalAvailable < amount) {
        toast.error(
          `Solde insuffisant. Requis: ${amount} CDF | Disponible: ${totalAvailable} CDF`,
          { description: 'Rechargez votre portefeuille pour continuer' }
        );
        return { success: false, error: 'Solde insuffisant', bonusUsed: 0, balanceUsed: 0 };
      }

      // ✅ Paiement mixte : bonus en priorité, puis complément avec balance
      const bonusUsed = Math.min(bonusBalance, amount);
      const balanceUsed = amount - bonusUsed;

      // Débiter les deux colonnes en une seule requête
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          bonus_balance: bonusBalance - bonusUsed,
          balance: mainBalance - balanceUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Déterminer le type de paiement pour le log
      const paidWithBonus = bonusUsed > 0;
      const isMixed = bonusUsed > 0 && balanceUsed > 0;
      const activityType = bonusUsed === amount ? 'bonus_payment' : isMixed ? 'mixed_payment' : 'wallet_payment';

      // Logger la transaction
      await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: activityType,
        description: `${description}${isMixed ? ` (${bonusUsed} bonus + ${balanceUsed} solde)` : ''}`,
        amount: -amount,
        currency: 'CDF',
        reference_type: referenceType,
        reference_id: referenceId,
        metadata: { bonus_used: bonusUsed, balance_used: balanceUsed }
      });

      // Toast clair selon le cas
      if (bonusUsed === amount) {
        toast.success(`Payé avec bonus : ${amount} CDF`);
      } else if (isMixed) {
        toast.success(`Payé : ${bonusUsed} CDF bonus + ${balanceUsed} CDF solde`);
      } else {
        toast.success(`Payé : ${amount} CDF`);
      }

      return { success: true, paidWithBonus, bonusUsed, balanceUsed };
    } catch (error) {
      console.error('❌ Erreur paiement wallet:', error);
      toast.error('Erreur lors du paiement');
      return { success: false, error: 'Erreur de transaction', bonusUsed: 0, balanceUsed: 0 };
    }
  };

  return { payWithWallet };
};
