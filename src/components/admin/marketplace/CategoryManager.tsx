import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Edit, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Category {
  id: string;
  name: string;
  name_fr: string;
  slug: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const CategoryManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({
    name_fr: '',
    description: '',
    icon: ''
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    name_fr: '',
    slug: '',
    icon: 'Package',
    description: ''
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch product counts per category
  const { data: productCounts } = useQuery({
    queryKey: ['category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('category')
        .eq('moderation_status', 'approved');
      
      if (error) throw error;

      // Count products by category
      const counts = data.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([category, count]) => ({ category, count }));
    }
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la catégorie a été modifié.'
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le statut.'
      });
    }
  });

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      toast({
        title: 'Catégorie mise à jour',
        description: 'Les modifications ont été enregistrées.'
      });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour la catégorie.'
      });
    }
  });

  // Add category
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: typeof newCategoryForm) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .insert([newCategory]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      toast({
        title: 'Catégorie ajoutée',
        description: 'La nouvelle catégorie a été créée avec succès.'
      });
      setAddDialogOpen(false);
      setNewCategoryForm({
        name: '',
        name_fr: '',
        slug: '',
        icon: 'Package',
        description: ''
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter la catégorie.'
      });
    }
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      toast({
        title: 'Catégorie supprimée',
        description: 'La catégorie a été supprimée avec succès.'
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la catégorie. Vérifiez qu\'aucun produit n\'y est associé.'
      });
    }
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditForm({
      name_fr: category.name_fr,
      description: category.description || '',
      icon: category.icon || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        ...editForm
      });
    }
  };

  const handleAddCategory = () => {
    addCategoryMutation.mutate(newCategoryForm);
  };

  const handleDeleteCategory = (category: Category) => {
    const productCount = productCounts?.find(pc => pc.category === category.slug)?.count || 0;
    if (productCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Impossible de supprimer',
        description: `Cette catégorie contient ${productCount} produit(s). Veuillez d'abord les déplacer.`
      });
      return;
    }
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion des Catégories
          </CardTitle>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {categories?.map((category) => {
              const productCount = productCounts?.find(pc => pc.category === category.slug)?.count || 0;
              
              return (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{category.name_fr}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {category.slug}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {productCount} produits
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${category.id}`} className="text-sm">
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Label>
                          <Switch
                            id={`active-${category.id}`}
                            checked={category.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: category.id, is_active: checked })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={productCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_name">Nom (anglais)</Label>
              <Input
                id="new_name"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                placeholder="Ex: Electronics"
              />
            </div>
            <div>
              <Label htmlFor="new_name_fr">Nom (français)</Label>
              <Input
                id="new_name_fr"
                value={newCategoryForm.name_fr}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name_fr: e.target.value })}
                placeholder="Ex: Électronique"
              />
            </div>
            <div>
              <Label htmlFor="new_slug">Slug</Label>
              <Input
                id="new_slug"
                value={newCategoryForm.slug}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="Ex: electronique"
              />
            </div>
            <div>
              <Label htmlFor="new_icon">Icône (Lucide)</Label>
              <Input
                id="new_icon"
                value={newCategoryForm.icon}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, icon: e.target.value })}
                placeholder="Ex: Smartphone"
              />
            </div>
            <div>
              <Label htmlFor="new_description">Description</Label>
              <Input
                id="new_description"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddCategory} 
              disabled={!newCategoryForm.name || !newCategoryForm.name_fr || !newCategoryForm.slug || addCategoryMutation.isPending}
            >
              {addCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name_fr">Nom (français)</Label>
              <Input
                id="name_fr"
                value={editForm.name_fr}
                onChange={(e) => setEditForm({ ...editForm, name_fr: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="icon">Icône (Lucide)</Label>
              <Input
                id="icon"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="Ex: Smartphone, Home, etc."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCategoryMutation.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie "{categoryToDelete?.name_fr}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
