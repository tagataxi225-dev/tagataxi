import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, MoreHorizontal,
  Search, Filter, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Job } from '@/types/jobs';
import { toast } from 'sonner';

interface AdminJobsListProps {
  onEdit: (jobId: string) => void;
  onCreateNew: () => void;
  showQuickStats?: boolean;
}

export const AdminJobsList = ({ onEdit, onCreateNew, showQuickStats }: AdminJobsListProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_companies (
            id, name, logo_url, is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);

      if (error) throw error;
      
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: newStatus } : j
      ));
      toast.success(`Offre ${newStatus === 'active' ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteJobId) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', deleteJobId);

      if (error) throw error;
      
      setJobs(prev => prev.filter(j => j.id !== deleteJobId));
      toast.success('Offre supprimée');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteJobId(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.job_companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return '-';
    const formatter = new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 0 });
    if (job.salary_min && job.salary_max) {
      return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)} CDF`;
    }
    return `${formatter.format(job.salary_min || job.salary_max || 0)} CDF`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-0">Actif</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermé</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Offres d'emploi</CardTitle>
          <Button onClick={onCreateNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle offre
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
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune offre trouvée</p>
            <Button onClick={onCreateNew} variant="outline" className="mt-4">
              Créer une offre
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{job.title}</h3>
                      {getStatusBadge(job.status)}
                      {job.is_featured && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{job.job_companies?.name || 'Sans entreprise'}</span>
                      {job.job_companies?.is_verified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>•</span>
                      <span>{job.location_city}</span>
                      <span>•</span>
                      <span>{formatSalary(job)}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.views_count} vues
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(job.id)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                        {job.status === 'active' ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteJobId(job.id)}
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

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'offre et toutes ses candidatures seront supprimées.
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
    </Card>
  );
};
