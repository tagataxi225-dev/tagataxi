import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRentalSubscriptionPlans } from '@/hooks/useRentalSubscriptionPlans'
import { Plus, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORIES = [
  { value: 'ECO', label: 'Tricycle / Moto', icon: '🛵' },
  { value: 'BERLINE', label: 'Berline Standard', icon: '🚗' },
  { value: 'UTILITAIRES', label: 'Utilitaires', icon: '🚚' },
  { value: 'SUV_4X4', label: 'SUV & 4x4', icon: '🚙' },
  { value: 'MINIBUS', label: 'Minibus', icon: '🚐' },
  { value: 'FIRST_CLASS', label: 'First Class', icon: '🏎️' },
]

const TIERS = [
  { value: 'BASIC', label: 'Basic', color: 'bg-gray-500' },
  { value: 'SILVER', label: 'Silver', color: 'bg-slate-400' },
  { value: 'GOLD', label: 'Gold', color: 'bg-yellow-500' },
  { value: 'PLATINUM', label: 'Platinum', color: 'bg-purple-500' },
]

export const RentalSubscriptionPlansByCategory = () => {
  const { plans, createPlan, updatePlan, deletePlan, isLoading } = useRentalSubscriptionPlans()
  const [selectedCategory, setSelectedCategory] = useState('ECO')
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredPlans = plans.filter(p => p.vehicle_category === selectedCategory)

  const handleCreatePlan = (formData: any) => {
    createPlan({
      ...formData,
      vehicle_category: selectedCategory
    })
    setIsCreateOpen(false)
  }

  const handleUpdatePlan = (formData: any) => {
    updatePlan({
      id: editingPlan.id,
      updates: formData
    })
    setEditingPlan(null)
  }

  const PlanForm = ({ plan, onSubmit }: { plan?: any, onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState(plan || {
      name: '',
      description: '',
      tier_name: 'BASIC',
      monthly_price: 0,
      currency: 'CDF',
      max_vehicles: 3,
      max_photos: 10,
      video_allowed: false,
      support_level: 'standard',
      support_response_time: '24-48h',
      api_access: false,
      custom_branding: false,
      visibility_boost: 1,
      featured_listing: false,
      analytics_level: 'basic',
      badge_type: '',
      priority_level: 1,
      is_active: true
    })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom du Plan</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: ECO Basic"
            />
          </div>
          
          <div>
            <Label>Tier</Label>
            <Select value={formData.tier_name} onValueChange={(value) => setFormData({ ...formData, tier_name: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description du plan"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Prix Mensuel (CDF)</Label>
            <Input
              type="number"
              value={formData.monthly_price}
              onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Max Véhicules</Label>
            <Input
              type="number"
              value={formData.max_vehicles}
              onChange={(e) => setFormData({ ...formData, max_vehicles: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Max Photos</Label>
            <Input
              type="number"
              value={formData.max_photos}
              onChange={(e) => setFormData({ ...formData, max_photos: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label>Vidéo autorisée</Label>
            <Switch
              checked={formData.video_allowed}
              onCheckedChange={(checked) => setFormData({ ...formData, video_allowed: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Featured Listing</Label>
            <Switch
              checked={formData.featured_listing}
              onCheckedChange={(checked) => setFormData({ ...formData, featured_listing: checked })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Support Level</Label>
            <Select value={formData.support_level} onValueChange={(value) => setFormData({ ...formData, support_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="prioritaire">Prioritaire</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="24/7">24/7</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Boost Visibilité</Label>
            <Input
              type="number"
              value={formData.visibility_boost}
              onChange={(e) => setFormData({ ...formData, visibility_boost: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label>Badge Type</Label>
          <Input
            value={formData.badge_type}
            onChange={(e) => setFormData({ ...formData, badge_type: e.target.value })}
            placeholder="Ex: Partenaire Pro"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Plan Actif</Label>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>

        <Button onClick={() => onSubmit(formData)} className="w-full">
          {plan ? 'Mettre à jour' : 'Créer le plan'}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <div>Chargement des plans...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans par Catégorie de Véhicule</h2>
          <p className="text-muted-foreground">
            Gérez les 24 plans d'abonnement location (6 catégories × 4 tiers)
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau plan - {CATEGORIES.find(c => c.value === selectedCategory)?.label}</DialogTitle>
              <DialogDescription>
                Configurez les fonctionnalités et le tarif du plan
              </DialogDescription>
            </DialogHeader>
            <PlanForm onSubmit={handleCreatePlan} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-6 w-full">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="flex items-center gap-1">
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(category => (
          <TabsContent key={category.value} value={category.value} className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {TIERS.map(tier => {
                const plan = filteredPlans.find(p => p.tier_name === tier.value)
                
                return (
                  <Card key={tier.value} className={plan ? 'border-2' : 'border-dashed opacity-50'}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge className={tier.color}>{tier.label}</Badge>
                        {plan && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPlan(plan)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Supprimer ce plan ?')) {
                                  deletePlan(plan.id)
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{plan?.name || `${category.label} ${tier.label}`}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {plan?.description || 'Plan non configuré'}
                      </CardDescription>
                    </CardHeader>
                    
                    {plan && (
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prix mensuel</span>
                          <span className="font-bold">{plan.monthly_price.toLocaleString()} {plan.currency}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max véhicules</span>
                          <span>{plan.max_vehicles}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Photos</span>
                          <span>{plan.max_photos === 999 ? 'Illimité' : plan.max_photos}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Support</span>
                          <span className="text-xs">{plan.support_level}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Boost</span>
                          <Badge variant="outline">×{plan.visibility_boost}</Badge>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le plan</DialogTitle>
            <DialogDescription>
              Mettez à jour les fonctionnalités et le tarif
            </DialogDescription>
          </DialogHeader>
          {editingPlan && <PlanForm plan={editingPlan} onSubmit={handleUpdatePlan} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
