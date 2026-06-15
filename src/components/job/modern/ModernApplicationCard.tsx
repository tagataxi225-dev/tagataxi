import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle2, XCircle, MessageSquare, 
  Trophy, ChevronRight, Building2, MapPin, Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobApplication, APPLICATION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface ModernApplicationCardProps {
  application: JobApplication;
  onClick?: () => void;
  index?: number;
}

const statusConfig = {
  pending: {
    icon: Clock,
    gradient: 'from-slate-500/10 to-slate-500/5',
    iconColor: 'text-slate-500',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  seen: {
    icon: CheckCircle2,
    gradient: 'from-blue-500/10 to-blue-500/5',
    iconColor: 'text-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  interview: {
    icon: MessageSquare,
    gradient: 'from-violet-500/10 to-violet-500/5',
    iconColor: 'text-violet-500',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  rejected: {
    icon: XCircle,
    gradient: 'from-red-500/10 to-red-500/5',
    iconColor: 'text-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  hired: {
    icon: Trophy,
    gradient: 'from-emerald-500/10 via-green-500/10 to-emerald-500/5',
    iconColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

export const ModernApplicationCard = ({ 
  application, 
  onClick,
  index = 0 
}: ModernApplicationCardProps) => {
  const { language } = useLanguage();
  const status = application.status;
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const statusLabel = APPLICATION_STATUS_LABELS[status]?.[language] || status;
  const timeAgo = formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true, locale: fr });

  // Confetti effect for hired status
  useEffect(() => {
    if (status === 'hired' && index === 0) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#06b6d4'],
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, index]);

  const job = application.job;
  const company = job?.job_companies;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} border border-border/50 p-4`}>
        {/* Status timeline indicator */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-30" style={{ color: config.iconColor.replace('text-', '') }} />
        
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 rounded-xl border border-border/50">
            <AvatarImage src={company?.logo_url} className="object-cover" />
            <AvatarFallback className="bg-muted rounded-xl">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {job?.title || 'Poste'}
              </h3>
              <Badge className={`${config.badgeClass} border-0 shrink-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusLabel}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {company?.name || 'Entreprise'}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {job?.location_city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location_city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 self-center" />
        </div>

        {/* Progress timeline */}
        <div className="mt-4 flex items-center gap-1">
          {(['pending', 'seen', 'interview', 'hired'] as const).map((step, i) => {
            const stepIndex = ['pending', 'seen', 'interview', 'hired'].indexOf(status);
            const currentIndex = i;
            const isCompleted = currentIndex <= stepIndex && status !== 'rejected';
            const isRejected = status === 'rejected' && currentIndex <= stepIndex;
            
            return (
              <div key={step} className="flex-1 flex items-center gap-1">
                <div 
                  className={`
                    h-1.5 flex-1 rounded-full transition-all duration-500
                    ${isRejected ? 'bg-red-500/30' : isCompleted ? 'bg-emerald-500' : 'bg-muted/50'}
                  `}
                />
                {i < 3 && <div className="w-1" />}
              </div>
            );
          })}
        </div>
        
        {status === 'hired' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg"
          >
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Félicitations ! Vous êtes embauché 🎉
            </span>
          </motion.div>
        )}
        
        {status === 'interview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3"
          >
            <Button
              size="sm"
              className="w-full h-9 bg-violet-500 hover:bg-violet-600 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Voir les détails de l'entretien
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
