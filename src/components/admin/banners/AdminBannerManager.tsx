import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import imageCompression from 'browser-image-compression';

interface BannerForm {
  title: string;
  description: string;
  cta_text: string;
  cta_action: string;
  display_priority: number;
  start_date: string;
  end_date: string;
  placement: string;
}

const defaultForm: BannerForm = {
  title: '',
  description: '',
  cta_text: 'Découvrir',
  cta_action: 'navigate',
  display_priority: 1,
  start_date: '',
  end_date: '',
  placement: 'home',
};

const PLACEMENT_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  home: { label: 'Accueil', variant: 'default' },
  marketplace: { label: 'Marketplace', variant: 'secondary' },
  popup: { label: 'Popup', variant: 'destructive' },
  all: { label: 'Partout', variant: 'outline' },
};

export const AdminBannerManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_ads')
        .select('*')
        .order('display_priority', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promotional_ads')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners-active'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const banner = banners.find((b) => b.id === id);
      if (banner?.image_url) {
        const path = banner.image_url.split('/promo-banners/')[1];
        if (path) await supabase.storage.from('promo-banners').remove([path]);
      }
      const { error } = await supabase.from('promotional_ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners-active'] });
      toast({ title: 'Bannière supprimée' });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const { error } = await supabase
        .from('promotional_ads')
        .update({ display_priority: priority })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners-active'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: 'Veuillez sélectionner une image', variant: 'destructive' });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: 'Le titre est requis', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Compress image
      const compressed = await imageCompression(selectedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const ext = compressed.name.split('.').pop() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('promo-banners')
        .upload(fileName, compressed, { contentType: compressed.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('promo-banners')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('promotional_ads').insert({
        title: form.title,
        description: form.description || form.title,
        cta_text: form.cta_text || 'Découvrir',
        cta_action: form.cta_action || 'navigate',
        image_url: urlData.publicUrl,
        display_priority: form.display_priority,
        is_active: true,
        start_date: form.start_date || new Date().toISOString(),
        end_date: form.end_date || null,
        placement: form.placement,
      });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners-active'] });
      setDialogOpen(false);
      setForm(defaultForm);
      setSelectedFile(null);
      setPreview(null);
      toast({ title: 'Bannière ajoutée avec succès' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const movePriority = (id: string, direction: 'up' | 'down') => {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const currentPriority = banners[idx].display_priority ?? idx;
    const swapPriority = banners[swapIdx].display_priority ?? swapIdx;

    priorityMutation.mutate({ id: banners[idx].id, priority: swapPriority });
    priorityMutation.mutate({ id: banners[swapIdx].id, priority: currentPriority });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gestion des Bannières
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle bannière</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Image *</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                {preview && (
                  <img src={preview} alt="Preview" className="mt-2 w-full aspect-[16/9] object-cover rounded-lg" />
                )}
              </div>
              <div>
                <Label>Titre *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre de la bannière" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description courte" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priorité</Label>
                  <Input type="number" min={1} value={form.display_priority} onChange={(e) => setForm({ ...form, display_priority: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <Label>Texte CTA</Label>
                  <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Emplacement</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Accueil (carousel)</SelectItem>
                    <SelectItem value="marketplace">Marketplace (carousel)</SelectItem>
                    <SelectItem value="popup">Popup (overlay plein écran)</SelectItem>
                    <SelectItem value="all">Partout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date début</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={uploading} className="w-full">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours...</> : 'Ajouter la bannière'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucune bannière. Les images statiques par défaut seront affichées.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner, idx) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="w-24 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-24 h-14 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant={PLACEMENT_LABELS[(banner as any).placement || 'home']?.variant || 'default'}>
                      {PLACEMENT_LABELS[(banner as any).placement || 'home']?.label || 'Accueil'}
                    </Badge>
                  </TableCell>
                  <TableCell>{banner.display_priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: banner.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => movePriority(banner.id, 'up')} disabled={idx === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => movePriority(banner.id, 'down')} disabled={idx === banners.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(banner.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBannerManager;
