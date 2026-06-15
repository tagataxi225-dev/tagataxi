import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, DollarSign, Calendar, Users } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  vehicle_categories: string[];
  is_active: boolean;
  created_at: string;
}

export const RentalSubscriptionManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'CDF',
    duration_days: '30',
    features: '',
    vehicle_categories: '',
    is_active: true
  });

  // Mock data pour les plans d'abonnement
  const plans = [
    {
      id: '1',
      name: 'Plan Starter',
      price: 15000,
      currency: 'CDF',
      duration_days: 30,
      features: ['Publication de véhicule', 'Photos standard', 'Support par email'],
      vehicle_categories: ['ECO'],
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'Plan Business',
      price: 35000,
      currency: 'CDF',
      duration_days: 30,
      features: ['Publication illimitée', 'Photos HD', 'Support prioritaire'],
      vehicle_categories: ['ECO', 'PREMIUM'],
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];
  const isLoading = false;

  // Mock data pour les catégories en attendant la vraie table
  const categories = [
    { id: '1', name: 'ECO' },
    { id: '2', name: 'PREMIUM' },
    { id: '3', name: 'FIRST CLASS' },
    { id: '4', name: 'UTILITAIRES' }
  ];

  // Mutation pour créer/modifier un plan
  const savePlan = useMutation({
    mutationFn: async (planData: any) => {
      const payload = {
        ...planData,
        price: parseFloat(planData.price),
        duration_days: parseInt(planData.duration_days),
        features: planData.features.split(',').map((f: string) => f.trim()).filter(Boolean),
        vehicle_categories: planData.vehicle_categories.split(',').map((c: string) => c.trim()).filter(Boolean)
      };

      // Mock mutation - log the data for now
      console.log('Plan data to save:', payload);
      
      // Return mock success
      return { 
        id: editingPlan?.id || Date.now().toString(),
        ...payload 
      };
    },
    onSuccess: () => {
      toast({
        title: editingPlan ? 'Plan modifié' : 'Plan créé',
        description: `Le plan d'abonnement a été ${editingPlan ? 'modifié' : 'créé'} avec succès.`,
      });
      // Mock invalidation - would refresh real data
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
        variant: 'destructive',
      });
      console.error('Save plan error:', error);
    }
  });

  // Mutation pour supprimer un plan
  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      // Mock deletion
      console.log('Deleting plan:', planId);
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Plan supprimé',
        description: 'Le plan d\'abonnement a été supprimé avec succès.',
      });
      // Mock invalidation
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
      console.error('Delete plan error:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      currency: 'CDF',
      duration_days: '30',
      features: '',
      vehicle_categories: '',
      is_active: true
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      currency: plan.currency,
      duration_days: '30', // Valeur par défaut
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      vehicle_categories: 'ECO, PREMIUM', // Valeur par défaut
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePlan.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Abonnements</h2>
          <p className="text-muted-foreground">
            Configurez les plans d'abonnement pour la publication de véhicules
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Modifier le Plan' : 'Créer un Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du Plan</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plan Premium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="5000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">CDF</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="XOF">XOF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Select value={formData.duration_days} onValueChange={(value) => setFormData({ ...formData, duration_days: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="365">365 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Fonctionnalités (séparées par des virgules)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Publication illimitée, Photos HD, Support prioritaire"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">Catégories de véhicules (séparées par des virgules)</Label>
                <Textarea
                  id="categories"
                  value={formData.vehicle_categories}
                  onChange={(e) => setFormData({ ...formData, vehicle_categories: e.target.value })}
                  placeholder="ECO, PREMIUM, FIRST CLASS"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Plan actif</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={savePlan.isPending}>
                  {savePlan.isPending ? 'Sauvegarde...' : (editingPlan ? 'Modifier' : 'Créer')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {plan.price.toLocaleString()} {plan.currency}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>30 jours</span>
              </div>

              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fonctionnalités:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index}>• {String(feature)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Catégories:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">ECO</Badge>
                  <Badge variant="outline" className="text-xs">PREMIUM</Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(plan as any)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePlan.mutate(plan.id)}
                  disabled={deletePlan.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!plans?.length && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Aucun plan d'abonnement configuré</p>
              <p className="text-sm text-muted-foreground">
                Créez votre premier plan pour permettre aux partenaires de publier leurs véhicules
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};