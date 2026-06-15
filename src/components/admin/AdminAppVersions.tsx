import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Smartphone, Monitor, Apple, Loader2, Zap } from 'lucide-react';

interface AppVersion {
  id: string;
  platform: string;
  version: string;
  is_mandatory: boolean;
  release_notes: string | null;
  store_url: string | null;
  created_at: string;
}

const PLATFORM_CONFIG: Record<string, { label: string; icon: typeof Smartphone; color: string }> = {
  android: { label: 'Android', icon: Smartphone, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  ios: { label: 'iOS', icon: Apple, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  web: { label: 'Web', icon: Monitor, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
};

const emptyForm = { platform: 'android', version: '', is_mandatory: false, release_notes: '', store_url: '' };

export const AdminAppVersions = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erreur chargement des versions');
    } else {
      setVersions((data as any[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVersions(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (v: AppVersion) => {
    setEditingId(v.id);
    setForm({
      platform: v.platform,
      version: v.version,
      is_mandatory: v.is_mandatory ?? false,
      release_notes: v.release_notes ?? '',
      store_url: v.store_url ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.version.trim()) { toast.error('Version requise'); return; }
    setSaving(true);
    const payload = {
      platform: form.platform,
      version: form.version.trim(),
      is_mandatory: form.is_mandatory,
      release_notes: form.release_notes.trim() || null,
      store_url: form.store_url.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from('app_versions').update(payload).eq('id', editingId);
      if (error) toast.error('Erreur modification'); else toast.success('Version modifiée');
    } else {
      const { error } = await supabase.from('app_versions').insert(payload);
      if (error) toast.error('Erreur création'); else toast.success('Version ajoutée');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchVersions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette version ?')) return;
    const { error } = await supabase.from('app_versions').delete().eq('id', id);
    if (error) toast.error('Erreur suppression'); else { toast.success('Supprimée'); fetchVersions(); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Gestion des Versions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Version actuelle de l'app : <Badge variant="outline" className="ml-1">{APP_CONFIG.version}</Badge>
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle version
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : versions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune version enregistrée</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {versions.map((v) => {
            const cfg = PLATFORM_CONFIG[v.platform] || PLATFORM_CONFIG.web;
            const Icon = cfg.icon;
            return (
              <Card key={v.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Badge variant="outline" className={cn(cfg.color, 'gap-1.5 px-2.5 py-1')}>
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </Badge>
                    <span className="font-mono font-semibold text-lg">{v.version}</span>
                    {v.is_mandatory && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                    {v.release_notes && (
                      <span className="text-sm text-muted-foreground truncate max-w-[300px]">{v.release_notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la version' : 'Nouvelle version'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plateforme</Label>
              <Select value={form.platform} onValueChange={(v) => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Version (ex: 1.23.0)</Label>
              <Input value={form.version} onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.23.0" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mise à jour obligatoire</Label>
              <Switch checked={form.is_mandatory} onCheckedChange={(v) => setForm(f => ({ ...f, is_mandatory: v }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes de version</Label>
              <Textarea value={form.release_notes} onChange={(e) => setForm(f => ({ ...f, release_notes: e.target.value }))} placeholder="Nouveautés, corrections..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>URL du Store (optionnel)</Label>
              <Input value={form.store_url} onChange={(e) => setForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://play.google.com/store/apps/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
