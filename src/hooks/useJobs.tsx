import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobApplication } from '@/types/jobs';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UseJobsFilters {
  category?: string;
  search?: string;
  location?: string;
  employmentType?: string;
}

export const useJobs = (filters?: UseJobsFilters) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('jobs')
        .select(`
          *,
          job_companies (
            id,
            name,
            logo_url,
            is_verified
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.location) {
        query = query.eq('location_city', filters.location);
      }

      if (filters?.employmentType) {
        query = query.eq('employment_type', filters.employmentType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mappedJobs = (data || []).map(job => ({
        ...job,
        company: job.job_companies || undefined
      }));
      setJobs(mappedJobs as Job[]);
    } catch (err) {
      logger.error('Error fetching jobs:', err);
      setError('Erreur lors du chargement des offres');
      toast.error('Impossible de charger les offres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters?.category, filters?.search, filters?.location, filters?.employmentType]);

  return { jobs, loading, error, refetch: fetchJobs };
};

export const useJobDetails = (jobId: string | null) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetails = async () => {
      try {
        setLoading(true);

        // Increment view count
        await supabase.rpc('increment_job_views', { job_id: jobId });

        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            job_companies (
              id,
              name,
              logo_url,
              description,
              is_verified
            )
          `)
          .eq('id', jobId)
          .single();

        if (error) throw error;
        const mappedJob = data ? { ...data, company: data.job_companies || undefined } : null;
        setJob(mappedJob as Job);
      } catch (err) {
        logger.error('Error fetching job details:', err);
        toast.error('Erreur lors du chargement de l\'offre');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  return { job, loading };
};

export const useJobApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            location_city,
            employment_type,
            job_companies (
              name,
              logo_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      const mappedData = (data || []).map((app: any) => ({
        ...app,
        job: app.jobs ? { ...app.jobs, job_companies: app.jobs.job_companies } : undefined,
      }));
      setApplications(mappedData as JobApplication[]);
    } catch (err) {
      logger.error('Error fetching applications:', err);
      toast.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return { applications, loading, refetch: fetchApplications };
};

export const useJobActions = () => {
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyToJob = async (jobId: string, data: { resume_url?: string; cover_letter?: string }) => {
    try {
      setApplying(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour postuler');
        return false;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          resume_url: data.resume_url,
          cover_letter: data.cover_letter,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Vous avez déjà postulé à cette offre');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Candidature envoyée avec succès !');
      return true;
    } catch (err) {
      logger.error('Error applying to job:', err);
      toast.error('Erreur lors de l\'envoi de la candidature');
      return false;
    } finally {
      setApplying(false);
    }
  };

  const saveJob = async (jobId: string) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const { error } = await supabase
        .from('job_saved')
        .insert({ job_id: jobId, user_id: user.id });

      if (error) {
        if (error.code === '23505') {
          toast.info('Offre déjà sauvegardée');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Offre sauvegardée');
      return true;
    } catch (err) {
      logger.error('Error saving job:', err);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const unsaveJob = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('job_saved')
        .delete()
        .match({ job_id: jobId, user_id: user.id });

      if (error) throw error;

      toast.success('Offre retirée des favoris');
      return true;
    } catch (err) {
      logger.error('Error unsaving job:', err);
      toast.error('Erreur');
      return false;
    }
  };

  return { applyToJob, saveJob, unsaveJob, applying, saving };
};
