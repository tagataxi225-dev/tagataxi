import { useState } from 'react';
import { useAmbassadorManager, CreateAmbassadorData } from '@/hooks/admin/useAmbassadorManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown, Plus, Users, TrendingUp, Coins, Loader2, Pencil, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const ambassadorSchema = z.object({
  ambassador_name: z.string().trim().min(2, 'Minimum 2 caractères').max(100),
  code: z.string().trim().toUpperCase().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Lettres et chiffres uniquement').optional().or(z.literal('')),
  max_referrals: z.number().int().min(1).max(99999),
  bonus_per_referral: z.number().min(0).max(50000),
  referred_bonus: z.number().min(0).max(50000),
  ambassador_note: z.string().max(500).optional(),
  user_id: z.string().min(1, 'Utilisateur requis'),
});

const defaultForm = {
  ambassador_name: '',
  code: '',
  max_referrals: 500,
  bonus_per_referral: 1000,
  referred_bonus: 500,
  ambassador_note: '',
  user_id: '',
};

const AdminAmbassadorManager = () => {
  const { ambassadors, isLoading, stats, createAmbassador, updateAmbassador, toggleActive } = useAmbassadorManager();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setForm({
      ambassador_name: a.ambassador_name || '',
      code: a.code || '',
      max_referrals: a.max_referrals,
      bonus_per_referral: a.bonus_per_referral,
      referred_bonus: a.referred_bonus,
      ambassador_note: a.ambassador_note || '',
      user_id: a.user_id,
    });
    setEditingId(a.id);
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const parsed = ambassadorSchema.safeParse({
      ...form,
      code: form.code || undefined,
      max_referrals: Number(form.max_referrals),
      bonus_per_referral: Number(form.bonus_per_referral),
      referred_bonus: Number(form.referred_bonus),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    const payload: CreateAmbassadorData = {
      ambassador_name: form.ambassador_name,
      code: form.code || undefined,
      max_referrals: Number(form.max_referrals),
      bonus_per_referral: Number(form.bonus_per_referral),
      referred_bonus: Number(form.referred_bonus),
      ambassador_note: form.ambassador_note,
      user_id: form.user_id,
    };

    let ok: boolean;
    if (editingId) {
      ok = (await updateAmbassador(editingId, payload)) ?? false;
    } else {
      ok = (await createAmbassador(payload)) ?? false;
    }

    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copié', description: `Code ${code} copié` });
  };

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Ambassadeurs</h2>
            <p className="text-sm text-muted-foreground">Gérez les codes de parrainage influenceurs</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Crown className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Ambassadeurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary"><Users className="h-5 w-5 text-secondary-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{formatNum(stats.totalReferrals)}</p>
              <p className="text-xs text-muted-foreground">Inscrits via ambassadeurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent"><Coins className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{formatNum(stats.totalEarnings)} CDF</p>
              <p className="text-xs text-muted-foreground">Total distribué</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun ambassadeur</p>
              <p className="text-sm">Créez votre premier code ambassadeur</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ambassadeur</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Utilisations</TableHead>
                  <TableHead className="text-right">Gains</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ambassadors.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{a.ambassador_name || '—'}</p>
                        {a.ambassador_note && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{a.ambassador_note}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => copyCode(a.code)} className="flex items-center gap-1.5 font-mono text-sm bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors">
                        {a.code}
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{a.successful_referrals || 0}</span>
                      <span className="text-muted-foreground">/{a.max_referrals}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNum(a.total_earnings || 0)} CDF
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={a.is_active}
                        onCheckedChange={() => toggleActive(a.id, a.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {editingId ? 'Modifier l\'ambassadeur' : 'Nouveau code ambassadeur'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Nom de l'ambassadeur *</Label>
              <Input
                placeholder="@PatrickVlog"
                value={form.ambassador_name}
                onChange={e => setForm(f => ({ ...f, ambassador_name: e.target.value }))}
                maxLength={100}
              />
              {errors.ambassador_name && <p className="text-xs text-destructive mt-1">{errors.ambassador_name}</p>}
            </div>

            {!editingId && (
              <div>
                <Label>Code personnalisé <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input
                  placeholder="Auto-généré si vide"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                  maxLength={20}
                  className="font-mono uppercase"
                />
                {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
              </div>
            )}

            <div>
              <Label>User ID (utilisateur associé) *</Label>
              <Input
                placeholder="UUID de l'utilisateur"
                value={form.user_id}
                onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
              />
              {errors.user_id && <p className="text-xs text-destructive mt-1">{errors.user_id}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Limite</Label>
                <Input
                  type="number"
                  value={form.max_referrals}
                  onChange={e => setForm(f => ({ ...f, max_referrals: parseInt(e.target.value) || 0 }))}
                  min={1}
                  max={99999}
                />
              </div>
              <div>
                <Label>Bonus parrain</Label>
                <Input
                  type="number"
                  value={form.bonus_per_referral}
                  onChange={e => setForm(f => ({ ...f, bonus_per_referral: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>
              <div>
                <Label>Bonus filleul</Label>
                <Input
                  type="number"
                  value={form.referred_bonus}
                  onChange={e => setForm(f => ({ ...f, referred_bonus: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label>Note interne</Label>
              <Textarea
                placeholder="Ex: Influenceur TikTok 50k abonnés"
                value={form.ambassador_note}
                onChange={e => setForm(f => ({ ...f, ambassador_note: e.target.value }))}
                maxLength={500}
                rows={2}
              />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full h-11">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Mettre à jour' : 'Créer le code ambassadeur'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAmbassadorManager;
