import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Clock, Briefcase, Building2, Eye, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

interface JobDetailsSheetProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const JobDetailsSheet = ({ job, open, onClose, onApply }: JobDetailsSheetProps) => {
  const { language } = useLanguage();

  if (!job) return null;

  const company = job.company || job.job_companies;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'À négocier';
    const formatter = new Intl.NumberFormat('fr-CD', { style: 'decimal', maximumFractionDigits: 0 });
    if (job.salary_min && job.salary_max) {
      return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)} ${job.currency}`;
    }
    return `${formatter.format(job.salary_min || job.salary_max || 0)} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left mb-4">
          <div className="flex items-start gap-4 mb-4">
            {/* Premium avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 rounded-2xl border-2 border-primary/20 shadow-sm">
                <AvatarImage src={company?.logo_url} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 text-primary text-2xl font-bold">
                  {company?.name?.charAt(0) || 'K'}
                </AvatarFallback>
              </Avatar>
              {!company?.logo_url && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-xl leading-tight line-clamp-2">{job.title}</SheetTitle>
                {job.is_featured && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0">
                    ⭐ À la une
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium">{company?.name || 'Entreprise'}</span>
                {company?.is_verified && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          </div>

          {/* Salary highlight */}
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salaire</p>
              <p className="text-base font-semibold text-primary">{formatSalary()}</p>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            <Badge variant="outline" className="rounded-full px-3 py-1.5 shrink-0 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {job.location_city}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1.5 shrink-0 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {employmentLabel}
            </Badge>
            {job.is_remote && (
              <Badge variant="outline" className="rounded-full px-3 py-1.5 shrink-0">🏠 Remote</Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Publié {new Date(job.created_at).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {job.views_count} vues
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">Description du poste</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">Compétences requises</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5 rounded-full">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {company?.description && (
            <div>
              <h3 className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">À propos de l'entreprise</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {company.description}
              </p>
            </div>
          )}

          {(job.start_date || job.end_date) && (
            <div>
              <h3 className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">Dates</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {job.start_date && <div>Début : {new Date(job.start_date).toLocaleDateString('fr-FR')}</div>}
                {job.end_date && <div>Fin : {new Date(job.end_date).toLocaleDateString('fr-FR')}</div>}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sticky glassmorphism CTA */}
        <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 mt-6 bg-background/80 backdrop-blur-xl border-t border-border/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12 shrink-0 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({ title: job.title, text: `${job.title} - ${company?.name}` });
                }
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              onClick={onApply} 
              className="flex-1 h-12 text-base font-semibold rounded-xl"
              size="lg"
            >
              Postuler maintenant
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
