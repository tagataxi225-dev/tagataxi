import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Building2, CheckCircle2, XCircle,
  Search, MoreHorizontal, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { JobCompany } from '@/types/jobs';
import { toast } from 'sonner';

interface CompanyFormData {
  name: string;
  description: string;
  logo_url: string;
  address: string;
  city: string;
  is_verified: boolean;
}

const initialFormData: CompanyFormData = {
  name: '',
  description: '',
  logo_url: '',
  address: '',
  city: 'Kinshasa',
  is_verified: false,
};

export const AdminCompanyManager = () => {
  const [companies, setCompanies] = useState<JobCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies((data || []) as JobCompany[]);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleEdit = (company: JobCompany) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      description: company.description || '',
      logo_url: company.logo_url || '',
      address: company.address || '',
      city: company.city || 'Kinshasa',
      is_verified: company.is_verified,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const companyData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city,
        is_verified: formData.is_verified,
        owner_user_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('job_companies')
          .update(companyData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Entreprise mise à jour');
      } else {
        const { error } = await supabase
          .from('job_companies')
          .insert(companyData);
        if (error) throw error;
        toast.success('Entreprise créée');
      }

      handleCloseForm();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('job_companies')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      setCompanies(prev => prev.filter(c => c.id !== deleteId));
      toast.success('Entreprise supprimée');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleVerified = async (company: JobCompany) => {
    try {
      const { error } = await supabase
        .from('job_companies')
        .update({ is_verified: !company.is_verified })
        .eq('id', company.id);

      if (error) throw error;
      
      setCompanies(prev => prev.map(c => 
        c.id === company.id ? { ...c, is_verified: !c.is_verified } : c
      ));
      toast.success(`Entreprise ${!company.is_verified ? 'vérifiée' : 'non vérifiée'}`);
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Erreur');
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Entreprises</CardTitle>
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle entreprise
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucune entreprise trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-lg">
                      <AvatarImage src={company.logo_url} />
                      <AvatarFallback className="rounded-lg bg-muted">
                        {company.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{company.name}</h3>
                        {company.is_verified ? (
                          <Badge className="bg-green-500/10 text-green-600 border-0 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Non vérifié
                          </Badge>
                        )}
                      </div>
                      {company.city && (
                        <p className="text-sm text-muted-foreground">{company.city}</p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVerified(company)}>
                          {company.is_verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Retirer vérification
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Vérifier
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(company.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'entreprise..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="logo_url">URL du logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse"
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="Kinshasa">Kinshasa</option>
                <option value="Lubumbashi">Lubumbashi</option>
                <option value="Kolwezi">Kolwezi</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_verified" className="cursor-pointer">Entreprise vérifiée</Label>
              <Switch
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(v) => setFormData({ ...formData, is_verified: v })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entreprise ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les offres associées ne seront pas supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
