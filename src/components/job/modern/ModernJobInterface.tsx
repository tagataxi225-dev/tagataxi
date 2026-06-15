import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Briefcase, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModernJobHero } from './ModernJobHero';
import { ModernJobFilters } from './ModernJobFilters';
import { ModernJobCard } from './ModernJobCard';
import { ModernJobDetails } from './ModernJobDetails';
import { ModernApplicationCard } from './ModernApplicationCard';
import { JobApplyForm } from '../JobApplyForm';
import { useJobs, useJobDetails, useJobActions, useJobApplications } from '@/hooks/useJobs';
import { Job } from '@/types/jobs';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModernJobInterfaceProps {
  onBack: () => void;
}

export const ModernJobInterface = ({ onBack }: ModernJobInterfaceProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [view, setView] = useState<'jobs' | 'applications'>('jobs');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { jobs, loading } = useJobs({
    category: selectedCategory,
    search: searchQuery,
    location: location || undefined
  });

  const { job: selectedJob, loading: jobLoading } = useJobDetails(selectedJobId);
  const { applications, loading: appsLoading, refetch: refetchApplications } = useJobApplications();
  const { applyToJob, saveJob, applying } = useJobActions();

  // Filter for remote only
  const filteredJobs = useMemo(() => {
    if (!remoteOnly) return jobs;
    return jobs.filter(job => job.is_remote);
  }, [jobs, remoteOnly]);

  // Separate featured and standard jobs
  const featuredJobs = filteredJobs.filter(job => job.is_featured);
  const standardJobs = filteredJobs.filter(job => !job.is_featured);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach(job => {
      counts[job.category] = (counts[job.category] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  const interviewCount = applications.filter(a => a.status === 'interview').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJobId(job.id);
    setShowDetails(true);
  };

  const handleApply = () => {
    setShowDetails(false);
    setShowApplyForm(true);
  };

  const handleSubmitApplication = async (data: { resume_url?: string; cover_letter?: string }) => {
    if (!selectedJobId) return false;
    const success = await applyToJob(selectedJobId, data);
    if (success) {
      refetchApplications();
      setView('applications');
    }
    return success;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-semibold leading-none">Tembea Job</span>
                <p className="text-xs text-muted-foreground">{filteredJobs?.length || 0} offres</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {interviewCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {interviewCount}
                </span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'jobs' ? (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <ModernJobHero
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                location={location}
                onLocationChange={setLocation}
                jobCount={filteredJobs.length}
              />

              <ModernJobFilters
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categoryCounts={categoryCounts}
              />

              <ScrollArea className="flex-1">
                <div className="px-4 pb-24 space-y-3">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="h-10 w-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="mt-4 text-sm text-muted-foreground">Chargement des offres...</p>
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                        <Briefcase className="h-10 w-10 text-emerald-500/50" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mb-4">
                        Modifiez vos filtres ou revenez plus tard pour de nouvelles opportunités.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setLocation('');
                          setSelectedCategory('all');
                          setRemoteOnly(false);
                        }}
                        className="rounded-xl"
                      >
                        Réinitialiser les filtres
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {/* Featured jobs section */}
                      {featuredJobs.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span>Offres en vedette</span>
                          </div>
                          {featuredJobs.map((job, index) => (
                            <ModernJobCard
                              key={job.id}
                              job={job}
                              variant="featured"
                              onClick={() => handleJobClick(job)}
                              index={index}
                            />
                          ))}
                        </div>
                      )}

                      {/* Standard jobs */}
                      {standardJobs.length > 0 && (
                        <div className="space-y-2">
                          {featuredJobs.length > 0 && (
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2">
                              <span>Toutes les offres</span>
                              <Badge variant="secondary" className="text-xs">
                                {standardJobs.length}
                              </Badge>
                            </div>
                          )}
                          {standardJobs.map((job, index) => (
                            <ModernJobCard
                              key={job.id}
                              job={job}
                              variant="standard"
                              onClick={() => handleJobClick(job)}
                              index={index}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="applications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Mes candidatures</h2>
                    <Badge variant="secondary">{applications.length}</Badge>
                  </div>

                  {appsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : applications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Postulez à des offres pour suivre vos candidatures ici.
                      </p>
                    </motion.div>
                  ) : (
                    applications.map((application, index) => (
                      <ModernApplicationCard
                        key={application.id}
                        application={application}
                        index={index}
                        onClick={() => {
                          if (application.job) {
                            handleJobClick(application.job as Job);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-3 pb-safe"
      >
        <div className="flex gap-2 max-w-md mx-auto">
          <Button
            variant={view === 'jobs' ? 'default' : 'ghost'}
            onClick={() => setView('jobs')}
            className={`
              flex-1 h-12 rounded-xl gap-2 transition-all
              ${view === 'jobs' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' 
                : ''
              }
            `}
          >
            <Briefcase className="h-5 w-5" />
            <span className="font-medium">Offres</span>
          </Button>
          
          <Button
            variant={view === 'applications' ? 'default' : 'ghost'}
            onClick={() => setView('applications')}
            className={`
              flex-1 h-12 rounded-xl gap-2 transition-all relative
              ${view === 'applications' 
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20' 
                : ''
              }
            `}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Candidatures</span>
            {interviewCount > 0 && view !== 'applications' && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-medium animate-pulse">
                {interviewCount}
              </span>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Job details sheet */}
      <ModernJobDetails
        job={selectedJob}
        open={showDetails}
        onClose={() => setShowDetails(false)}
        onApply={handleApply}
        loading={jobLoading}
      />

      {/* Apply form */}
      <JobApplyForm
        jobTitle={selectedJob?.title || ''}
        open={showApplyForm}
        onClose={() => setShowApplyForm(false)}
        onSubmit={handleSubmitApplication}
        loading={applying}
      />
    </div>
  );
};
