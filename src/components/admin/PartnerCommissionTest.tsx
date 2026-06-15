import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PartnerCommissionTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCommission = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 TEST: Invoking partner-subscription-commission Edge Function...');
      
      const payload = {
        subscription_id: 'eaf29333-e0d7-4d5b-bab5-2dc1ebddcd5c',
        driver_id: '6bd56fde-04c4-40b9-9813-28dc99b4e9f2',
        subscription_amount: 25000,
        partner_id: 'e54d7556-2f84-4e68-a6c2-bfb2a85e67bc'
      };

      console.log('📦 Payload:', payload);

      const { data, error } = await supabase.functions.invoke('partner-subscription-commission', {
        body: payload
      });

      if (error) {
        console.error('❌ Edge Function Error:', error);
        throw error;
      }

      console.log('✅ Edge Function Success:', data);
      setResult(data);

      // Vérifier les résultats dans la base de données
      const [earnings, wallet, notifications] = await Promise.all([
        supabase
          .from('partner_subscription_earnings')
          .select('*')
          .eq('subscription_id', payload.subscription_id)
          .single(),
        supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', payload.partner_id)
          .single(),
        supabase
          .from('system_notifications')
          .select('*')
          .eq('user_id', payload.partner_id)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      console.log('💰 Partner Subscription Earnings:', earnings.data);
      console.log('💳 Partner Wallet Balance:', wallet.data?.balance);
      console.log('🔔 Latest Notification:', notifications.data);

      toast.success('✅ Test réussi ! Commission créée avec succès');
    } catch (error: any) {
      console.error('❌ Test Error:', error);
      toast.error(`Erreur: ${error.message}`);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Test Commission Partenaire 5%</CardTitle>
        <CardDescription>
          Teste l'Edge Function partner-subscription-commission avec l'abonnement existant de "hadou kone"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p><strong>Subscription ID:</strong> eaf29333-e0d7-4d5b-bab5-2dc1ebddcd5c</p>
          <p><strong>Driver ID:</strong> 6bd56fde-04c4-40b9-9813-28dc99b4e9f2</p>
          <p><strong>Partner ID:</strong> e54d7556-2f84-4e68-a6c2-bfb2a85e67bc</p>
          <p><strong>Montant abonnement:</strong> 25,000 CDF</p>
          <p><strong>Commission attendue:</strong> 1,250 CDF (5%)</p>
        </div>

        <Button 
          onClick={testCommission} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '⏳ Test en cours...' : '▶️ Lancer le Test'}
        </Button>

        {result && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">📊 Résultat:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Vérifications à faire après le test:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ partner_subscription_earnings: 1 nouvelle ligne créée</li>
            <li>✅ user_wallets balance: +1,250 CDF (de 13,260 → 14,510)</li>
            <li>✅ system_notifications: Nouvelle notification "Commission Abonnement"</li>
            <li>✅ activity_logs: Log avec type "partner_subscription_commission"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
