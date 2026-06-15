import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, Building2 } from 'lucide-react';
import { JobApplication, APPLICATION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MyApplicationsScreenProps {
  applications: JobApplication[];
  loading: boolean;
}

export const MyApplicationsScreen = ({ applications, loading }: MyApplicationsScreenProps) => {
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-64 text-center px-4"
      >
        <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
        <p className="text-sm text-muted-foreground">
          Vous n'avez pas encore postulé à une offre
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4">
      {applications.map((application, index) => {
        const job = application.job;
        if (!job) return null;

        const statusInfo = APPLICATION_STATUS_LABELS[application.status];
        const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;

        return (
          <motion.div
            key={application.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-all">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={job.job_companies?.logo_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {job.job_companies?.name?.charAt(0) || 'K'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {job.title}
                    </h3>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
                    >
                      {language === 'fr' ? statusInfo.fr : statusInfo.en}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <Building2 className="h-3 w-3" />
                    <span className="line-clamp-1">{job.job_companies?.name || 'Entreprise'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      <MapPin className="h-3 w-3" />
                      {job.location_city}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      <Briefcase className="h-3 w-3" />
                      {employmentLabel}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Postulé le {new Date(application.submitted_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
