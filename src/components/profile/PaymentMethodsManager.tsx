import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  method_type: string;
  provider: string;
  account_number: string;
  account_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
}

export const PaymentMethodsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [formData, setFormData] = useState({
    method_type: 'mobile_money',
    provider: 'airtel',
    account_number: '',
    account_name: '',
  });

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          ...formData,
          is_primary: paymentMethods.length === 0,
        });

      if (error) throw error;

      toast({
        title: "Méthode ajoutée",
        description: "Nouvelle méthode de paiement ajoutée avec succès.",
      });

      setIsAddingMethod(false);
      setFormData({
        method_type: 'mobile_money',
        provider: 'airtel',
        account_number: '',
        account_name: '',
      });
      loadPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la méthode de paiement.",
        variant: "destructive",
      });
    }
  };

  const setPrimaryMethod = async (methodId: string) => {
    try {
      // Remove primary from all methods
      await supabase
        .from('payment_methods')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Set new primary
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_primary: true })
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: "Méthode principale",
        description: "Méthode de paiement principale mise à jour.",
      });

      loadPaymentMethods();
    } catch (error) {
      console.error('Error setting primary method:', error);
      toast({
        title: "Erreur",
        description: "Impossible de définir la méthode principale.",
        variant: "destructive",
      });
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: "Méthode supprimée",
        description: "Méthode de paiement supprimée avec succès.",
      });

      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la méthode de paiement.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Méthodes de paiement</CardTitle>
          <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="method_type">Type de méthode</Label>
                  <Select
                    value={formData.method_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, method_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="vodacom">M-Pesa</SelectItem>
                      <SelectItem value="raw_bank">RAW Bank</SelectItem>
                      <SelectItem value="equity_bank">Equity Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="account_number">Numéro de compte</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Ex: +243 123 456 789"
                  />
                </div>

                <div>
                  <Label htmlFor="account_name">Nom du titulaire</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                    placeholder="Nom complet"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addPaymentMethod} className="flex-1">
                    Ajouter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingMethod(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune méthode de paiement configurée
            </p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.provider}</span>
                        {method.is_primary && (
                          <Badge variant="default">
                            <Star className="w-3 h-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                        {method.is_verified && (
                          <Badge variant="secondary">Vérifié</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.account_number}
                      </p>
                      {method.account_name && (
                        <p className="text-sm text-muted-foreground">
                          {method.account_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!method.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryMethod(method.id)}
                      >
                        Définir principal
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePaymentMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};