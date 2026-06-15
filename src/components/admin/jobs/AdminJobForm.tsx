import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { JOB_CATEGORIES, EMPLOYMENT_TYPE_LABELS, JobEmploymentType } from '@/types/jobs';

interface AdminJobFormProps {
  jobId: string | null;
  onClose: () => void;
}

interface JobCompany {
  id: string;
  name: string;
}

interface JobFormData {
  title: string;
  description: string;
  company_id: string;
  category: string;
  employment_type: JobEmploymentType;
  salary_min: string;
  salary_max: string;
  location_city: string;
  is_remote: boolean;
  is_featured: boolean;
  skills: string;
  status: 'draft' | 'active' | 'closed';
}

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];

const initialFormData: JobFormData = {
  title: '',
  description: '',
  company_id: '',
  category: 'Transport & Logistique',
  employment_type: 'full_time',
  salary_min: '',
  salary_max: '',
  location_city: 'Kinshasa',
  is_remote: false,
  is_featured: false,
  skills: '',
  status: 'active',
};

export const AdminJobForm = ({ jobId, onClose }: AdminJobFormProps) => {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [companies, setCompanies] = useState<JobCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanies();
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('job_companies')
      .select('id, name')
      .order('name');
    setCompanies(data || []);
  };

  const fetchJob = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      const validEmploymentTypes = ['full_time', 'part_time', 'contract', 'freelance', 'internship'] as const;
      const validStatuses = ['draft', 'active', 'closed'] as const;
      
      const employmentType = validEmploymentTypes.includes(data.employment_type as any) 
        ? data.employment_type as JobEmploymentType 
        : 'full_time';
      
      const status = validStatuses.includes(data.status as any) 
        ? data.status as 'draft' | 'active' | 'closed' 
        : 'active';
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        company_id: data.company_id || '',
        category: data.category || 'Transport & Logistique',
        employment_type: employmentType,
        salary_min: data.salary_min?.toString() || '',
        salary_max: data.salary_max?.toString() || '',
        location_city: data.location_city || 'Kinshasa',
        is_remote: data.is_remote || false,
        is_featured: data.is_featured || false,
        skills: (data.skills || []).join(', '),
        status: status,
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company_id: formData.company_id || null,
        category: formData.category,
        employment_type: formData.employment_type,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        currency: 'CDF',
        location_city: formData.location_city,
        is_remote: formData.is_remote,
        is_featured: formData.is_featured,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        status: formData.status,
        posted_by_user_id: user.id,
      };

      if (jobId) {
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', jobId);
        if (error) throw error;
        toast.success('Offre mise à jour');
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert(jobData);
        if (error) throw error;
        toast.success('Offre créée');
      }

      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{jobId ? 'Modifier l\'offre' : 'Nouvelle offre'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="title">Titre du poste *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Chauffeur VTC Partenaire"
              />
            </div>

            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Select
                value={formData.company_id}
                onValueChange={(v) => setFormData({ ...formData, company_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le poste..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name.fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de contrat</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(v) => setFormData({ ...formData, employment_type: v as JobEmploymentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label.fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min">Salaire min (CDF)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="250000"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Salaire max (CDF)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="450000"
                />
              </div>
            </div>

            <div>
              <Label>Ville</Label>
              <Select
                value={formData.location_city}
                onValueChange={(v) => setFormData({ ...formData, location_city: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Permis B, Bonne conduite, Ponctualité"
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as 'draft' | 'active' | 'closed' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_remote" className="cursor-pointer">Télétravail possible</Label>
              <Switch
                id="is_remote"
                checked={formData.is_remote}
                onCheckedChange={(v) => setFormData({ ...formData, is_remote: v })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_featured" className="cursor-pointer">Offre à la une</Label>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {jobId ? 'Mettre à jour' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};
