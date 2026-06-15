import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRentalSubscriptionPlans } from '@/hooks/useRentalSubscriptionPlans';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';

export const RentalSubscriptionPlans = () => {
  const { plans, isLoading, createPlan, updatePlan, deletePlan, isCreating, isUpdating } = useRentalSubscriptionPlans();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthly_price: 0,
    currency: 'CDF',
    category_id: '',
    features: [],
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthly_price: 0,
      currency: 'CDF',
      category_id: '',
      features: [],
      is_active: true
    });
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Le nom du plan est requis');
      return;
    }
    
    if (!formData.monthly_price || formData.monthly_price <= 0) {
      alert('Le prix mensuel doit être supérieur à 0');
      return;
    }
    
    if (editingPlan) {
      updatePlan({
        id: editingPlan.id,
        updates: formData
      });
    } else {
      createPlan(formData);
    }
    
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      monthly_price: plan.monthly_price,
      currency: plan.currency,
      category_id: plan.category_id || '',
      features: plan.features || [],
      is_active: plan.is_active
    });
    setIsCreateModalOpen(true);
  };

  const handleFeaturesChange = (features: string) => {
    setFormData(prev => ({
      ...prev,
      features: features.split('\n').filter(f => f.trim())
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Plans d'Abonnement Location
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez les plans d'abonnement pour les partenaires location
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (open) {
                setTimeout(() => {
                  const dialogElement = document.querySelector('[role="dialog"]');
                  dialogElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Modifier le Plan' : 'Créer un Nouveau Plan'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom du Plan</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Plan Standard"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_price">Prix Mensuel</Label>
                      <Input
                        id="monthly_price"
                        type="number"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: Number(e.target.value) }))}
                        placeholder="30000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        placeholder="CDF"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category_id">Catégorie</Label>
                      <Input
                        id="category_id"
                        value={formData.category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        placeholder="eco, standard, premium"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du plan d'abonnement..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="features">Fonctionnalités (une par ligne)</Label>
                    <Textarea
                      id="features"
                      value={Array.isArray(formData.features) ? formData.features.join('\n') : ''}
                      onChange={(e) => handleFeaturesChange(e.target.value)}
                      placeholder="Accès plateforme&#10;Support 24/7&#10;Maintenance incluse"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Plan actif</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {editingPlan ? 'Modifier' : 'Créer'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fonctionnalités</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Aucun plan d'abonnement configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          {plan.description && (
                            <div className="text-sm text-muted-foreground">{plan.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {plan.monthly_price.toLocaleString()} {plan.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{plan.category_id || 'Non défini'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Array.isArray(plan.features) ? plan.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="text-sm">• {String(feature)}</div>
                          )) : (
                            <div className="text-sm text-muted-foreground">Aucune fonctionnalité</div>
                          )}
                          {Array.isArray(plan.features) && plan.features.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{plan.features.length - 2} autres...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};