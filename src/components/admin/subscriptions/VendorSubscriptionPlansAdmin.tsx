import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendorSubscriptionPlansAdmin, VendorPlanForm } from '@/hooks/useVendorSubscriptionPlansAdmin';
import { formatCurrency } from '@/utils/formatCurrency';
import { Plus, Pencil, Trash2, Loader2, Star, ShieldCheck } from 'lucide-react';

export const VendorSubscriptionPlansAdmin = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan, toggleActive, DEFAULT_FORM } = useVendorSubscriptionPlansAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorPlanForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      name_en: plan.name_en || '',
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      duration_days: plan.duration_days,
      duration_type: plan.duration_type,
      max_products: plan.max_products,
      max_photos_per_product: plan.max_photos_per_product,
      commission_rate: plan.commission_rate,
      priority_support: plan.priority_support,
      analytics_enabled: plan.analytics_enabled,
      verified_badge: plan.verified_badge,
      display_order: plan.display_order,
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      features: plan.features,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) return;
    setSaving(true);
    const ok = editingId
      ? await updatePlan(editingId, form)
      : await createPlan(form);
    setSaving(false);
    if (ok) setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce plan vendeur ?')) await deletePlan(id);
  };

  const setField = (key: keyof VendorPlanForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const durationLabel = (type: string, days: number) => {
    if (type === 'monthly') return `${days}j (mensuel)`;
    if (type === 'quarterly') return `${days}j (trimestriel)`;
    if (type === 'yearly') return `${days}j (annuel)`;
    return `${days}j`;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Plans Vendeurs Marketplace ({plans.length})</CardTitle>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nouveau plan</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Produits max</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {plan.name}
                    {plan.is_popular && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Populaire</Badge>}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(plan.price, plan.currency as any)}</TableCell>
                <TableCell>{durationLabel(plan.duration_type, plan.duration_days)}</TableCell>
                <TableCell>{plan.max_products}</TableCell>
                <TableCell>{plan.commission_rate != null ? `${plan.commission_rate}%` : '-'}</TableCell>
                <TableCell>
                  {plan.verified_badge ? <ShieldCheck className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Switch checked={plan.is_active} onCheckedChange={(v) => toggleActive(plan.id, v)} />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun plan vendeur</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le plan' : 'Nouveau plan vendeur'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nom (FR) *</Label>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ex: Gold" />
              </div>
              <div className="grid gap-2">
                <Label>Nom (EN)</Label>
                <Input value={form.name_en || ''} onChange={e => setField('name_en', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setField('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Prix *</Label>
                <Input type="number" value={form.price} onChange={e => setField('price', +e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Devise</Label>
                <Input value={form.currency} onChange={e => setField('currency', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Durée (jours)</Label>
                <Input type="number" value={form.duration_days} onChange={e => setField('duration_days', +e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Type durée</Label>
                <Select value={form.duration_type} onValueChange={v => setField('duration_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Produits max</Label>
                <Input type="number" value={form.max_products} onChange={e => setField('max_products', +e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Photos/produit max</Label>
                <Input type="number" value={form.max_photos_per_product ?? ''} onChange={e => setField('max_photos_per_product', e.target.value ? +e.target.value : null)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Commission (%)</Label>
                <Input type="number" value={form.commission_rate ?? ''} onChange={e => setField('commission_rate', e.target.value ? +e.target.value : null)} />
              </div>
              <div className="grid gap-2">
                <Label>Ordre affichage</Label>
                <Input type="number" value={form.display_order ?? 0} onChange={e => setField('display_order', +e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!form.priority_support} onCheckedChange={v => setField('priority_support', v)} />
                Support prioritaire
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!form.analytics_enabled} onCheckedChange={v => setField('analytics_enabled', v)} />
                Analytics
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!form.verified_badge} onCheckedChange={v => setField('verified_badge', v)} />
                Badge vérifié
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!form.is_popular} onCheckedChange={v => setField('is_popular', v)} />
                Populaire
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_active} onCheckedChange={v => setField('is_active', v)} />
                Actif
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || form.price <= 0}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
