import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Eye, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useMyPostedJobs, useJobPublisher } from '@/hooks/useJobPublisher';
import { JobPublisherForm } from './JobPublisherForm';
import { JobApplicationsManager } from './JobApplicationsManager';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobsManagerDashboardProps {
  userType: 'partner' | 'restaurant' | 'admin';
  defaultCompanyData?: {
    name: string;
    description?: string;
    logo_url?: string;
    city?: string;
  };
}

export const JobsManagerDashboard = ({
  userType,
  defaultCompanyData
}: JobsManagerDashboardProps) => {
  const { data: jobs, isLoading, refetch } = useMyPostedJobs();
  const { closeJob, deleteJob } = useJobPublisher();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCloseJob = async (jobId: string) => {
    await closeJob(jobId);
    refetch();
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    await deleteJob(jobToDelete);
    setJobToDelete(null);
    setIsDeleting(false);
    refetch();
  };

  const activeJobs = jobs?.filter(j => j.status === 'active') || [];
  const closedJobs = jobs?.filter(j => j.status !== 'active') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-700">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Clôturée</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mes offres d'emploi</h2>
          <p className="text-sm text-muted-foreground">
            {activeJobs.length} offre{activeJobs.length !== 1 ? 's' : ''} active{activeJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{jobs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total offres</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-foreground">{activeJobs.length}</p>
            <p className="text-xs text-muted-foreground">Actives</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {jobs?.reduce((acc, j) => acc + (j.views_count || 0), 0) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Vues totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Job List */}
      {jobs?.length === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Aucune offre publiée
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Créez votre première offre d'emploi pour attirer des talents
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer une offre
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                Offres actives
              </h3>
              {activeJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClose={() => handleCloseJob(job.id)}
                  onDelete={() => setJobToDelete(job.id)}
                  onViewApplications={() => setSelectedJobForApplications(job.id)}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}

          {/* Closed Jobs */}
          {closedJobs.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                Offres clôturées
              </h3>
              {closedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={() => setJobToDelete(job.id)}
                  onViewApplications={() => setSelectedJobForApplications(job.id)}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Job Form Modal */}
      <AnimatePresence>
        {showForm && (
          <JobPublisherForm
            onClose={() => setShowForm(false)}
            onSuccess={() => refetch()}
            userType={userType}
            defaultCompanyData={defaultCompanyData}
          />
        )}
      </AnimatePresence>

      {/* Applications Manager Modal */}
      <AnimatePresence>
        {selectedJobForApplications && (
          <JobApplicationsManager
            jobId={selectedJobForApplications}
            onClose={() => setSelectedJobForApplications(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!jobToDelete} onOpenChange={() => setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'offre et toutes les candidatures associées seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Job Card Component
interface JobCardProps {
  job: Job;
  onClose?: () => void;
  onDelete: () => void;
  onViewApplications: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

const JobCard = ({ job, onClose, onDelete, onViewApplications, getStatusBadge }: JobCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground truncate">
                  {job.title}
                </h4>
                {getStatusBadge(job.status)}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{job.location_city}</span>
                <span>•</span>
                <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type]?.fr}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(job.created_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={onViewApplications}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Users className="h-3.5 w-3.5" />
                  Candidatures
                </button>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {job.views_count} vues
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewApplications}>
                  <Users className="h-4 w-4 mr-2" />
                  Voir candidatures
                </DropdownMenuItem>
                {onClose && job.status === 'active' && (
                  <DropdownMenuItem onClick={onClose}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Clôturer l'offre
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
