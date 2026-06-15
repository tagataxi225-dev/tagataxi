import { motion } from 'framer-motion';
import { MapPin, Banknote, Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const JobCard = ({ job, onClick }: JobCardProps) => {
  const { language } = useLanguage();

  const company = job.company || job.job_companies;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    const formatter = new Intl.NumberFormat('fr-CD', { 
      style: 'decimal',
      maximumFractionDigits: 0 
    });
    
    if (job.salary_min && job.salary_max) {
      return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)} ${job.currency}`;
    }
    return `${formatter.format(job.salary_min || job.salary_max || 0)} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;
  const isFeatured = job.is_featured;
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group px-4 mb-3"
    >
      <div className={`
        relative rounded-xl p-4 transition-all duration-200 shadow-sm
        ${isFeatured 
          ? 'bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-primary/20' 
          : 'bg-card border border-border/40 hover:border-border hover:shadow-md'
        }
      `}>
        {isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5">
              ⭐ À la une
            </Badge>
          </div>
        )}

        <div className="flex gap-3">
          <Avatar className={`h-14 w-14 rounded-2xl border-2 shadow-sm ${isFeatured ? 'border-primary/20' : 'border-border/50'}`}>
            <AvatarImage src={company?.logo_url} className="object-cover" />
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 text-primary text-lg font-bold border-2 border-primary/20">
              {company?.name?.charAt(0).toUpperCase() || 'K'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm text-muted-foreground line-clamp-1">
                {company?.name || 'Entreprise'}
              </span>
              {company?.is_verified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {formatSalary() && (
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <Banknote className="h-3.5 w-3.5" />
                  <span>{formatSalary()}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{job.location_city}</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>{employmentLabel}</span>
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0 self-center group-hover:text-primary/60 transition-colors" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <Button
            size="sm"
            variant={isFeatured ? "default" : "ghost"}
            className={`h-7 text-xs px-3 ${!isFeatured && 'text-primary hover:text-primary hover:bg-primary/10'}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Voir l'offre
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
