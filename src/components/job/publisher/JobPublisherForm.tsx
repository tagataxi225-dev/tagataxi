import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2,
  Tag,
  FileText,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobPublisher, useJobCompany, CreateJobData, JobCompanyData } from '@/hooks/useJobPublisher';
import { JOB_CATEGORIES, EMPLOYMENT_TYPE_LABELS, JobEmploymentType } from '@/types/jobs';

interface JobPublisherFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  userType: 'partner' | 'restaurant' | 'admin';
  defaultCompanyData?: Partial<JobCompanyData>;
}

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];

export const JobPublisherForm = ({
  onClose,
  onSuccess,
  userType,
  defaultCompanyData
}: JobPublisherFormProps) => {
  const { createJob, isCreating } = useJobPublisher();
  const { company, isLoading: companyLoading } = useJobCompany();
  
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  
  // Company data
  const [companyData, setCompanyData] = useState<JobCompanyData>({
    name: company?.name || defaultCompanyData?.name || '',
    description: company?.description || defaultCompanyData?.description || '',
    logo_url: company?.logo_url || defaultCompanyData?.logo_url || '',
    city: company?.city || defaultCompanyData?.city || 'Kinshasa'
  });

  // Job data
  const [jobData, setJobData] = useState<CreateJobData>({
    title: '',
    description: '',
    category: userType === 'restaurant' ? 'Restauration' : 'Transport & Logistique',
    employment_type: 'full_time',
    salary_min: undefined,
    salary_max: undefined,
    location_city: 'Kinshasa',
    is_remote: false,
    skills: []
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !jobData.skills.includes(skillInput.trim())) {
      setJobData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async () => {
    if (!jobData.title || !jobData.description) {
      return;
    }

    await createJob({
      jobData,
      companyData: company ? undefined : companyData
    });

    onSuccess?.();
    onClose();
  };

  const canProceedStep1 = companyData.name.length >= 2;
  const canProceedStep2 = jobData.title.length >= 3 && jobData.description.length >= 20;

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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-primary p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-foreground">
                  Nouvelle offre d'emploi
                </h2>
                <p className="text-sm text-primary-foreground/80">
                  Étape {step}/3
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

          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Company Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-primary" />
                      Informations de l'entreprise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nom de l'entreprise *</Label>
                      <Input
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: TAGA Transport"
                        disabled={!!company}
                      />
                      {company && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Entreprise déjà configurée
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Description de l'entreprise</Label>
                      <Textarea
                        value={companyData.description || ''}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez brièvement votre entreprise..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Ville</Label>
                      <Select
                        value={companyData.city}
                        onValueChange={(v) => setCompanyData(prev => ({ ...prev, city: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="gap-2"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Job Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      Détails du poste
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Titre du poste *</Label>
                      <Input
                        value={jobData.title}
                        onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Chauffeur VTC expérimenté"
                      />
                    </div>

                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        value={jobData.description}
                        onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez les responsabilités, les qualifications requises..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {jobData.description.length}/20 caractères minimum
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Catégorie</Label>
                        <Select
                          value={jobData.category}
                          onValueChange={(v) => setJobData(prev => ({ ...prev, category: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name.fr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Type de contrat</Label>
                        <Select
                          value={jobData.employment_type}
                          onValueChange={(v) => setJobData(prev => ({ 
                            ...prev, 
                            employment_type: v as JobEmploymentType 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, val]) => (
                              <SelectItem key={key} value={key}>
                                {val.fr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Lieu de travail</Label>
                      <Select
                        value={jobData.location_city}
                        onValueChange={(v) => setJobData(prev => ({ ...prev, location_city: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Télétravail possible</Label>
                      <Switch
                        checked={jobData.is_remote}
                        onCheckedChange={(checked) => setJobData(prev => ({ ...prev, is_remote: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Retour
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="gap-2">
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Salary & Skills */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Salaire (CDF/mois)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Minimum</Label>
                        <Input
                          type="number"
                          value={jobData.salary_min || ''}
                          onChange={(e) => setJobData(prev => ({ 
                            ...prev, 
                            salary_min: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="500000"
                        />
                      </div>
                      <div>
                        <Label>Maximum</Label>
                        <Input
                          type="number"
                          value={jobData.salary_max || ''}
                          onChange={(e) => setJobData(prev => ({ 
                            ...prev, 
                            salary_max: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="1000000"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Laissez vide si le salaire est négociable
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="h-4 w-4 text-primary" />
                      Compétences requises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Ex: Permis B, Ponctualité..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddSkill}>
                        Ajouter
                      </Button>
                    </div>

                    {jobData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {jobData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive/20"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isCreating}
                    className="gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publication...
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4" />
                        Publier l'offre
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
