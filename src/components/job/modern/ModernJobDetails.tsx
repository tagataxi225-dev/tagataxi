import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, DollarSign, Clock, Briefcase, Building2, 
  Star, ChevronRight, Calendar, Users, Globe, Share2,
  CheckCircle2, ExternalLink
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModernJobDetailsProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  loading?: boolean;
}

export const ModernJobDetails = ({
  job,
  open,
  onClose,
  onApply,
  loading = false,
}: ModernJobDetailsProps) => {
  const { language } = useLanguage();

  if (!job) return null;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency}`;
    }
    return `${(job.salary_min || job.salary_max)?.toLocaleString()} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr });

  const infoItems = [
    { icon: MapPin, label: job.location_city, show: true },
    { icon: Briefcase, label: employmentLabel, show: true },
    { icon: Globe, label: 'Remote', show: job.is_remote },
    { icon: Calendar, label: `Publié ${timeAgo}`, show: true },
    { icon: Users, label: `${job.views_count} vues`, show: job.views_count > 0 },
  ].filter(item => item.show);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] rounded-t-3xl p-0 border-0 [&>button.absolute]:hidden"
      >
        <div className="flex flex-col h-full">
          {/* Hero header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
            
            <div className="relative px-5 pt-4 pb-5">
              {/* Drag handle */}
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex gap-4">
                <Avatar className="h-20 w-20 rounded-2xl border-2 border-white shadow-lg">
                  <AvatarImage src={job.job_companies?.logo_url} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl rounded-2xl">
                    {job.job_companies?.name?.charAt(0) || 'K'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start gap-2 mb-1">
                    {job.is_featured && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs shrink-0">
                        <Star className="h-3 w-3 mr-1 fill-white" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <SheetHeader className="text-left space-y-1">
                    <SheetTitle className="text-xl font-bold line-clamp-2 pr-8">
                      {job.title}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground">
                      {job.job_companies?.name || 'Entreprise'}
                    </span>
                    {job.job_companies?.is_verified && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-emerald-500/10 text-emerald-600 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary highlight */}
              {formatSalary() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 rounded-xl"
                >
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatSalary()}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Info pills */}
          <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {infoItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm text-muted-foreground shrink-0"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </motion.div>
            ))}
          </div>

          <Separator />

          {/* Content */}
          <ScrollArea className="flex-1 px-5">
            <div className="py-5 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Description
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Compétences requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Badge 
                          variant="secondary"
                          className="bg-primary/5 hover:bg-primary/10 text-foreground transition-colors cursor-default"
                        >
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company info */}
              {job.job_companies?.description && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    À propos de l'entreprise
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {job.job_companies.description}
                  </p>
                </div>
              )}
            </div>

            {/* Spacer for sticky CTA */}
            <div className="h-24" />
          </ScrollArea>

          {/* Sticky CTA */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm border-t border-border/50"
          >
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              <Button
                onClick={onApply}
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Postuler maintenant
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
