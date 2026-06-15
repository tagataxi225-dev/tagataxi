export interface JobCompany {
  id: string;
  owner_user_id: string;
  name: string;
  logo_url?: string;
  description?: string;
  address?: string;
  city?: string;
  is_verified: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  company_id?: string;
  company?: JobCompany;
  job_companies?: {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
    is_verified: boolean;
  };
  posted_by_user_id: string;
  title: string;
  description: string;
  category: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  salary_min?: number;
  salary_max?: number;
  currency: string;
  location_city: string;
  is_remote: boolean;
  skills: string[];
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'active' | 'closed' | 'expired';
  views_count: number;
  is_featured: boolean;
  moderation_status: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job?: Job;
  user_id: string;
  resume_url?: string;
  cover_letter?: string;
  status: 'pending' | 'seen' | 'interview' | 'rejected' | 'hired';
  submitted_at: string;
  updated_at: string;
}

export type JobEmploymentType = Job['employment_type'];
export type JobApplicationStatus = JobApplication['status'];

export const EMPLOYMENT_TYPE_LABELS: Record<JobEmploymentType, { fr: string; en: string }> = {
  full_time: { fr: 'Temps plein', en: 'Full time' },
  part_time: { fr: 'Temps partiel', en: 'Part time' },
  contract: { fr: 'Contrat', en: 'Contract' },
  freelance: { fr: 'Freelance', en: 'Freelance' },
  internship: { fr: 'Stage', en: 'Internship' }
};

export const JOB_CATEGORIES = [
  { id: 'all', name: { fr: 'Tous', en: 'All' }, icon: 'Briefcase' },
  { id: 'Transport & Logistique', name: { fr: 'Transport', en: 'Transport' }, icon: 'Car' },
  { id: 'Livraison', name: { fr: 'Livraison', en: 'Delivery' }, icon: 'Truck' },
  { id: 'Commerce & Vente', name: { fr: 'Commerce', en: 'Retail' }, icon: 'Store' },
  { id: 'Restauration', name: { fr: 'Restauration', en: 'Food Service' }, icon: 'UtensilsCrossed' },
  { id: 'Tech & IT', name: { fr: 'Tech', en: 'Tech' }, icon: 'Code' },
  { id: 'Marketing', name: { fr: 'Marketing', en: 'Marketing' }, icon: 'Megaphone' },
  { id: 'Support Client', name: { fr: 'Support', en: 'Support' }, icon: 'Headphones' },
  { id: 'Administration', name: { fr: 'Admin', en: 'Admin' }, icon: 'FileText' },
  { id: 'Autre', name: { fr: 'Autre', en: 'Other' }, icon: 'Box' }
];

export const APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, { fr: string; en: string; color: string }> = {
  pending: { fr: 'En attente', en: 'Pending', color: 'hsl(var(--muted-foreground))' },
  seen: { fr: 'Vue', en: 'Seen', color: 'hsl(var(--primary))' },
  interview: { fr: 'Entretien', en: 'Interview', color: 'hsl(220, 90%, 50%)' },
  rejected: { fr: 'Refusée', en: 'Rejected', color: 'hsl(var(--destructive))' },
  hired: { fr: 'Embauché', en: 'Hired', color: 'hsl(142, 76%, 36%)' }
};
