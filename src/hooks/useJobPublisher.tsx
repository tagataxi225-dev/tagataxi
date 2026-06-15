import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Job, JobEmploymentType } from '@/types/jobs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateJobData {
  title: string;
  description: string;
  category: string;
  employment_type: JobEmploymentType;
  salary_min?: number;
  salary_max?: number;
  location_city: string;
  is_remote: boolean;
  skills: string[];
  start_date?: string;
  end_date?: string;
}

export interface JobCompanyData {
  name: string;
  description?: string;
  logo_url?: string;
  address?: string;
  city?: string;
}

export const useJobCompany = () => {
  const { user } = useAuth();

  const { data: company, isLoading, refetch } = useQuery({
    queryKey: ['job-company', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('job_companies')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const createOrUpdateCompany = async (companyData: JobCompanyData): Promise<string | null> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('job_companies')
          .update({
            name: companyData.name,
            description: companyData.description,
            logo_url: companyData.logo_url,
            address: companyData.address,
            city: companyData.city
          })
          .eq('id', company.id);

        if (error) throw error;
        await refetch();
        return company.id;
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('job_companies')
          .insert({
            owner_user_id: user.id,
            name: companyData.name,
            description: companyData.description,
            logo_url: companyData.logo_url,
            address: companyData.address,
            city: companyData.city,
            is_verified: false
          })
          .select('id')
          .single();

        if (error) throw error;
        await refetch();
        return data.id;
      }
    } catch (err) {
      logger.error('Error creating/updating company:', err);
      toast.error('Erreur lors de la sauvegarde de l\'entreprise');
      return null;
    }
  };

  return { company, isLoading, createOrUpdateCompany, refetch };
};

export const useMyPostedJobs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-posted-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
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
        .eq('posted_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Job[];
    },
    enabled: !!user
  });
};

export const useJobApplicationsForPublisher = (jobId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-applications-publisher', jobId],
    queryFn: async () => {
      if (!user || !jobId) return [];
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            posted_by_user_id
          )
        `)
        .eq('job_id', jobId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Filter to only show applications for jobs posted by this user
      return data?.filter(app => app.jobs?.posted_by_user_id === user.id) || [];
    },
    enabled: !!user && !!jobId
  });
};

export const useJobPublisher = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { company, createOrUpdateCompany } = useJobCompany();

  const createJobMutation = useMutation({
    mutationFn: async ({ 
      jobData, 
      companyData 
    }: { 
      jobData: CreateJobData; 
      companyData?: JobCompanyData 
    }) => {
      if (!user) throw new Error('Non authentifié');

      // Ensure company exists
      let companyId = company?.id;
      
      if (!companyId && companyData) {
        companyId = await createOrUpdateCompany(companyData);
      }

      if (!companyId) {
        throw new Error('Entreprise non configurée');
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          company_id: companyId,
          posted_by_user_id: user.id,
          status: 'active',
          moderation_status: 'pending',
          currency: 'CDF',
          views_count: 0,
          is_featured: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Offre publiée avec succès !');
    },
    onError: (error) => {
      logger.error('Error creating job:', error);
      toast.error('Erreur lors de la publication de l\'offre');
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, data }: { jobId: string; data: Partial<CreateJobData> }) => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('jobs')
        .update(data)
        .eq('id', jobId)
        .eq('posted_by_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Offre mise à jour');
    },
    onError: (error) => {
      logger.error('Error updating job:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const closeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId)
        .eq('posted_by_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Offre clôturée');
    },
    onError: (error) => {
      logger.error('Error closing job:', error);
      toast.error('Erreur lors de la clôture');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('posted_by_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Offre supprimée');
    },
    onError: (error) => {
      logger.error('Error deleting job:', error);
      toast.error('Erreur lors de la suppression');
    }
  });

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ 
      applicationId, 
      status 
    }: { 
      applicationId: string; 
      status: 'pending' | 'seen' | 'interview' | 'rejected' | 'hired' 
    }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications-publisher'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      logger.error('Error updating application status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  });

  return {
    createJob: createJobMutation.mutateAsync,
    updateJob: updateJobMutation.mutateAsync,
    closeJob: closeJobMutation.mutateAsync,
    deleteJob: deleteJobMutation.mutateAsync,
    updateApplicationStatus: updateApplicationStatus.mutateAsync,
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending
  };
};
