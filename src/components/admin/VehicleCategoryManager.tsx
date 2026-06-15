import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Car, Settings, DollarSign } from 'lucide-react';
import { useAdminVehicleCategories, VehicleCategory } from '@/hooks/useAdminVehicleCategories';

export const VehicleCategoryManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VehicleCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'Car',
    color_class: 'text-blue-600',
    base_price: '',
    min_price: '',
    max_price: '',
    is_active: true,
    sort_order: '1'
  });

  // Utiliser les données réelles depuis la base de données
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting
  } = useAdminVehicleCategories();

  // Fonction pour sauvegarder une catégorie
  const handleSaveCategory = async () => {
    const payload = {
      name: formData.name,
      description: formData.description,
      icon_name: formData.icon_name,
      color_class: formData.color_class,
      base_price: parseFloat(formData.base_price) || 0,
      recommended_price_range: {
        min: parseFloat(formData.min_price) || 0,
        max: parseFloat(formData.max_price) || 0
      },
      is_active: formData.is_active,
      sort_order: parseInt(formData.sort_order) || 1
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...payload });
    } else {
      createCategory.mutate(payload);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'Car',
      color_class: 'text-blue-600',
      base_price: '',
      min_price: '',
      max_price: '',
      is_active: true,
      sort_order: '1'
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: VehicleCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon_name: category.icon_name || category.icon || 'Car',
      color_class: category.color_class || 'text-blue-600',
      base_price: category.base_price?.toString() || '',
      min_price: category.recommended_price_range?.min?.toString() || '',
      max_price: category.recommended_price_range?.max?.toString() || '',
      is_active: category.is_active,
      sort_order: (category.sort_order || category.priority)?.toString() || '1'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCategory();
  };

  const iconOptions = [
    'Car', 'Truck', 'Bus', 'Bike', 'Plane', 'Ship', 'Train'
  ];

  const colorOptions = [
    { value: 'text-blue-600', label: 'Bleu', bg: 'bg-blue-100' },
    { value: 'text-green-600', label: 'Vert', bg: 'bg-green-100' },
    { value: 'text-purple-600', label: 'Violet', bg: 'bg-purple-100' },
    { value: 'text-orange-600', label: 'Orange', bg: 'bg-orange-100' },
    { value: 'text-red-600', label: 'Rouge', bg: 'bg-red-100' },
    { value: 'text-yellow-600', label: 'Jaune', bg: 'bg-yellow-100' }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Types de Véhicules</h2>
          <p className="text-muted-foreground">
            Gérez les catégories de véhicules disponibles en location
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la Catégorie</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PREMIUM"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icône</Label>
                  <select
                    id="icon"
                    value={formData.icon_name}
                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <select
                    id="color"
                    value={formData.color_class}
                    onChange={(e) => setFormData({ ...formData, color_class: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Prix de Base (CDF)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_price">Prix Min Recommandé</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                    placeholder="40000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_price">Prix Max Recommandé</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    placeholder="80000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre d'Affichage</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Catégorie active</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? 'Sauvegarde...' : (editingCategory ? 'Modifier' : 'Créer')}
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
        {categories?.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorOptions.find(c => c.value === category.color_class)?.bg || 'bg-gray-100'}`}>
                    <Car className={`h-5 w-5 ${category.color_class || 'text-gray-600'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ordre: {category.sort_order || category.priority || 0}
                    </p>
                  </div>
                </div>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}

              {category.base_price && category.base_price > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {category.base_price.toLocaleString()} CDF
                  </span>
                </div>
              )}

              {category.recommended_price_range && (
                <div className="text-sm text-muted-foreground">
                  Fourchette recommandée: {category.recommended_price_range.min?.toLocaleString()} - {category.recommended_price_range.max?.toLocaleString()} CDF
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCategory.mutate(category.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!categories?.length && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Aucune catégorie de véhicule configurée</p>
              <p className="text-sm text-muted-foreground">
                Créez des catégories pour organiser les véhicules de location (ECO, PREMIUM, etc.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};