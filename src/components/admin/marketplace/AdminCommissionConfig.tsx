import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Save, TrendingUp } from 'lucide-react';

interface CommissionStats {
  total_commissions: number;
  total_vendor_revenue: number;
  total_orders: number;
}

export const AdminCommissionConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommissionStats>({
    total_commissions: 0,
    total_vendor_revenue: 0,
    total_orders: 0,
  });

  const [rates, setRates] = useState({
    gratuit: 15,
    standard: 10,
    premium: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les taux actuels (valeurs par défaut)
      setRates({
        gratuit: 15,
        standard: 10,
        premium: 5,
      });

      // Stats de commissions (exemple)
      setStats({
        total_commissions: 0,
        total_vendor_revenue: 0,
        total_orders: 0,
      });
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données de commissions.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    try {
      toast({
        title: 'Taux sauvegardés',
        description: `Gratuit: ${rates.gratuit}%, Standard: ${rates.standard}%, Premium: ${rates.premium}%`
      });
    } catch (error) {
      console.error('Error updating rates:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour les taux.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions perçues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_commissions.toLocaleString()} CDF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenus vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_vendor_revenue.toLocaleString()} CDF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Commandes traitées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_orders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration des taux */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des taux de commission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gratuit">Plan Gratuit (%)</Label>
              <Input
                id="gratuit"
                type="number"
                min="0"
                max="100"
                value={rates.gratuit}
                onChange={(e) => setRates({ ...rates, gratuit: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="standard">Plan Standard (%)</Label>
              <Input
                id="standard"
                type="number"
                min="0"
                max="100"
                value={rates.standard}
                onChange={(e) => setRates({ ...rates, standard: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium">Plan Premium (%)</Label>
              <Input
                id="premium"
                type="number"
                min="0"
                max="100"
                value={rates.premium}
                onChange={(e) => setRates({ ...rates, premium: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleUpdateRates} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les taux
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
