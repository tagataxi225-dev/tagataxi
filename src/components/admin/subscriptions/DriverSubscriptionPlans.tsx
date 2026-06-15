import { useState } from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDriverSubscriptionPlans } from '@/hooks/useDriverSubscriptionPlans'
import { Skeleton } from '@/components/ui/skeleton'

interface PlanFormData {
  name: string
  description: string
  price: string
  currency: string
  service_type: string
  rides_included: string
  price_per_extra_ride: string
  is_trial: boolean
  trial_duration_days: string
  is_active: boolean
}

export const DriverSubscriptionPlans = () => {
  const { plans, isLoading, createPlan, updatePlan, deletePlan, toggleActive, isCreating, isUpdating, isDeleting } = useDriverSubscriptionPlans()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [filterServiceType, setFilterServiceType] = useState<string>('all')

  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    currency: 'CDF',
    service_type: 'transport',
    rides_included: '',
    price_per_extra_ride: '',
    is_trial: false,
    trial_duration_days: '',
    is_active: true
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'CDF',
      service_type: 'transport',
      rides_included: '',
      price_per_extra_ride: '',
      is_trial: false,
      trial_duration_days: '',
      is_active: true
    })
    setEditingPlan(null)
  }

  const handleEdit = (plan: any) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      currency: plan.currency || 'CDF',
      service_type: plan.service_type || 'transport',
      rides_included: plan.rides_included?.toString() || '',
      price_per_extra_ride: plan.price_per_extra_ride?.toString() || '',
      is_trial: plan.is_trial || false,
      trial_duration_days: plan.trial_duration_days?.toString() || '',
      is_active: plan.is_active ?? true
    })
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Le nom du plan est requis');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Le prix doit être supérieur à 0');
      return;
    }
    
    if (formData.is_trial && (!formData.trial_duration_days || parseInt(formData.trial_duration_days) <= 0)) {
      alert('La durée d\'essai est requise pour un plan d\'essai');
      return;
    }

    const planData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      currency: formData.currency,
      service_type: formData.service_type,
      rides_included: formData.rides_included ? parseInt(formData.rides_included) : null,
      price_per_extra_ride: formData.price_per_extra_ride ? parseFloat(formData.price_per_extra_ride) : null,
      is_trial: formData.is_trial,
      trial_duration_days: formData.trial_duration_days ? parseInt(formData.trial_duration_days) : null,
      is_active: formData.is_active
    }

    if (editingPlan) {
      updatePlan({ id: editingPlan.id, updates: planData })
    } else {
      createPlan(planData)
    }

    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      deletePlan(id)
    }
  }

  const filteredPlans = filterServiceType === 'all' 
    ? plans 
    : plans.filter(p => p.service_type === filterServiceType)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans Chauffeurs/Livreurs</h2>
          <p className="text-muted-foreground">Gérez les plans d'abonnement pour les chauffeurs et livreurs</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (open) {
            setTimeout(() => {
              const dialogElement = document.querySelector('[role="dialog"]');
              dialogElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Modifier le plan' : 'Créer un nouveau plan'}</DialogTitle>
              <DialogDescription>
                Configurez les détails du plan d'abonnement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du plan *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Plan Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type">Type de service *</Label>
                  <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport VTC</SelectItem>
                      <SelectItem value="delivery">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du plan..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="rides_included">Courses incluses</Label>
                  <Input
                    id="rides_included"
                    type="number"
                    value={formData.rides_included}
                    onChange={(e) => setFormData({ ...formData, rides_included: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_per_extra_ride">Prix par course supplémentaire</Label>
                <Input
                  id="price_per_extra_ride"
                  type="number"
                  value={formData.price_per_extra_ride}
                  onChange={(e) => setFormData({ ...formData, price_per_extra_ride: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_trial">Plan d'essai gratuit</Label>
                  <p className="text-sm text-muted-foreground">Active un essai gratuit pour ce plan</p>
                </div>
                <Switch
                  id="is_trial"
                  checked={formData.is_trial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                />
              </div>

              {formData.is_trial && (
                <div className="space-y-2">
                  <Label htmlFor="trial_duration_days">Durée de l'essai (jours)</Label>
                  <Input
                    id="trial_duration_days"
                    type="number"
                    value={formData.trial_duration_days}
                    onChange={(e) => setFormData({ ...formData, trial_duration_days: e.target.value })}
                    placeholder="7"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Plan actif</Label>
                  <p className="text-sm text-muted-foreground">Rendre ce plan visible aux utilisateurs</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
                {editingPlan ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plans disponibles ({filteredPlans.length})</CardTitle>
            <Select value={filterServiceType} onValueChange={setFilterServiceType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="transport">Transport VTC</SelectItem>
                <SelectItem value="delivery">Livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    {plan.name}
                    {plan.is_trial && <Badge variant="secondary" className="ml-2">Essai</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {plan.service_type === 'transport' ? '🚗 Transport' : '📦 Livraison'}
                    </Badge>
                  </TableCell>
                  <TableCell>{plan.price.toLocaleString()} {plan.currency}</TableCell>
                  <TableCell>{plan.rides_included || '∞'}</TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive({ id: plan.id, isActive: !plan.is_active })}
                        title={plan.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {plan.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
