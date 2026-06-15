import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, User, Briefcase, Calendar, Mail, FileText,
  CheckCircle, XCircle, Clock, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { APPLICATION_STATUS_LABELS, JobApplicationStatus } from '@/types/jobs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ApplicationWithDetails {
  id: string;
  job_id: string;
  user_id: string;
  resume_url?: string;
  cover_letter?: string;
  status: JobApplicationStatus;
  submitted_at: string;
  jobs?: {
    title: string;
    location_city: string;
    job_companies?: {
      name: string;
    };
  };
  clients?: {
    display_name: string;
    email: string;
    phone_number: string;
  };
}

export const AdminApplicationsList = () => {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch applications with jobs
      const { data: appsData, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            title,
            location_city,
            job_companies (name)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch client info separately for each user_id
      const userIds = [...new Set((appsData || []).map(a => a.user_id))];
      const { data: clientsData } = await supabase
        .from('clients')
        .select('user_id, display_name, email, phone_number')
        .in('user_id', userIds);

      const clientsMap = new Map(clientsData?.map(c => [c.user_id, c]) || []);

      const enrichedApps = (appsData || []).map(app => ({
        ...app,
        status: app.status as JobApplicationStatus,
        clients: clientsMap.get(app.user_id) || undefined
      }));

      setApplications(enrichedApps as ApplicationWithDetails[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (applicationId: string, newStatus: JobApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur');
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    const config = APPLICATION_STATUS_LABELS[status];
    const icons: Record<JobApplicationStatus, typeof CheckCircle> = {
      pending: Clock,
      seen: MessageSquare,
      interview: Calendar,
      rejected: XCircle,
      hired: CheckCircle,
    };
    const Icon = icons[status];
    
    return (
      <Badge 
        style={{ 
          backgroundColor: `${config.color}20`,
          color: config.color,
          borderColor: 'transparent'
        }}
        className="gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.fr}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.clients?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Candidatures</CardTitle>
        
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label.fr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune candidature trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">
                        {app.clients?.display_name || 'Candidat'}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{app.jobs?.title || 'Offre supprimée'}</span>
                      {app.jobs?.job_companies?.name && (
                        <>
                          <span>•</span>
                          <span>{app.jobs.job_companies.name}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {app.clients?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {app.clients.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>

                    {app.cover_letter && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Select
                      value={app.status}
                      onValueChange={(v) => handleUpdateStatus(app.id, v as JobApplicationStatus)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label.fr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {app.resume_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => window.open(app.resume_url, '_blank')}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        CV
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
