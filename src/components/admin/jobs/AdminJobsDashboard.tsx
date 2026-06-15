import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Building2, Users, BarChart3 } from 'lucide-react';
import { AdminJobsList } from './AdminJobsList';
import { AdminJobForm } from './AdminJobForm';
import { AdminCompanyManager } from './AdminCompanyManager';
import { AdminApplicationsList } from './AdminApplicationsList';
import { JobStatsCards } from './JobStatsCards';

export const AdminJobsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);

  const handleEditJob = (jobId: string) => {
    setEditingJobId(jobId);
    setShowJobForm(true);
  };

  const handleCloseForm = () => {
    setEditingJobId(null);
    setShowJobForm(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Tembea Job - Administration</h1>
        <p className="text-muted-foreground mt-1">Gérez les offres d'emploi et les entreprises</p>
      </motion.div>

      <JobStatsCards />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="overview" className="gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2 py-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Offres</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2 py-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Entreprises</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Candidatures</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminJobsList 
            onEdit={handleEditJob} 
            onCreateNew={() => setShowJobForm(true)}
            showQuickStats
          />
        </TabsContent>

        <TabsContent value="jobs">
          <AdminJobsList 
            onEdit={handleEditJob} 
            onCreateNew={() => setShowJobForm(true)}
          />
        </TabsContent>

        <TabsContent value="companies">
          <AdminCompanyManager />
        </TabsContent>

        <TabsContent value="applications">
          <AdminApplicationsList />
        </TabsContent>
      </Tabs>

      {showJobForm && (
        <AdminJobForm 
          jobId={editingJobId} 
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};
