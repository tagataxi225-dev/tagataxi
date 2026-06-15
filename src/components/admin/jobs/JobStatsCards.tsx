import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building2, Users, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalCompanies: number;
  totalApplications: number;
  totalViews: number;
}

export const JobStatsCards = () => {
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCompanies: 0,
    totalApplications: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jobsRes, activeJobsRes, companiesRes, applicationsRes] = await Promise.all([
          supabase.from('jobs').select('id, views_count', { count: 'exact' }),
          supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('job_companies').select('id', { count: 'exact' }),
          supabase.from('job_applications').select('id', { count: 'exact' }),
        ]);

        const totalViews = (jobsRes.data || []).reduce((sum, job) => sum + (job.views_count || 0), 0);

        setStats({
          totalJobs: jobsRes.count || 0,
          activeJobs: activeJobsRes.count || 0,
          totalCompanies: companiesRes.count || 0,
          totalApplications: applicationsRes.count || 0,
          totalViews,
        });
      } catch (error) {
        console.error('Error fetching job stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Offres actives', 
      value: stats.activeJobs, 
      total: stats.totalJobs,
      icon: Briefcase, 
      color: 'text-primary' 
    },
    { 
      label: 'Entreprises', 
      value: stats.totalCompanies, 
      icon: Building2, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Candidatures', 
      value: stats.totalApplications, 
      icon: Users, 
      color: 'text-green-500' 
    },
    { 
      label: 'Vues totales', 
      value: stats.totalViews, 
      icon: Eye, 
      color: 'text-amber-500' 
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {stat.total !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    / {stat.total} total
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
