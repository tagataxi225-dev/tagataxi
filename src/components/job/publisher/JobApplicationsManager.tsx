import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  FileText,
  Loader2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJobApplicationsForPublisher, useJobPublisher } from '@/hooks/useJobPublisher';
import { APPLICATION_STATUS_LABELS, JobApplicationStatus } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobApplicationsManagerProps {
  jobId: string;
  onClose: () => void;
}

export const JobApplicationsManager = ({ jobId, onClose }: JobApplicationsManagerProps) => {
  const { data: applications, isLoading, refetch } = useJobApplicationsForPublisher(jobId);
  const { updateApplicationStatus } = useJobPublisher();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (applicationId: string, status: JobApplicationStatus) => {
    setUpdatingId(applicationId);
    await updateApplicationStatus({ applicationId, status });
    refetch();
    setUpdatingId(null);
  };

  const getStatusIcon = (status: JobApplicationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3.5 w-3.5" />;
      case 'seen':
        return <Mail className="h-3.5 w-3.5" />;
      case 'interview':
        return <MessageSquare className="h-3.5 w-3.5" />;
      case 'hired':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-hidden bg-background rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="bg-primary p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-foreground">
                  Candidatures
                </h2>
                <p className="text-sm text-primary-foreground/80">
                  {applications?.length || 0} candidature{(applications?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(85vh-80px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Aucune candidature
                </h3>
                <p className="text-sm text-muted-foreground">
                  Les candidatures apparaîtront ici
                </p>
              </div>
            ) : (
              applications?.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            Candidat #{application.id.slice(0, 8)}
                          </span>
                          <Badge 
                            variant="outline"
                            style={{ 
                              color: APPLICATION_STATUS_LABELS[application.status as JobApplicationStatus]?.color,
                              borderColor: APPLICATION_STATUS_LABELS[application.status as JobApplicationStatus]?.color
                            }}
                            className="gap-1"
                          >
                            {getStatusIcon(application.status as JobApplicationStatus)}
                            {APPLICATION_STATUS_LABELS[application.status as JobApplicationStatus]?.fr}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          Postulé {formatDistanceToNow(new Date(application.submitted_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>

                        {application.cover_letter && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-foreground line-clamp-3">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}

                        {application.resume_url && (
                          <a
                            href={application.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-3"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Voir le CV
                          </a>
                        )}

                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Statut:</span>
                          <Select
                            value={application.status}
                            onValueChange={(value) => handleStatusChange(
                              application.id, 
                              value as JobApplicationStatus
                            )}
                            disabled={updatingId === application.id}
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              {updatingId === application.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(APPLICATION_STATUS_LABELS).map(([key, val]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  {val.fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
};
