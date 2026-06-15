import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface JobApplyFormProps {
  jobTitle: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { resume_url?: string; cover_letter?: string }) => Promise<boolean>;
  loading?: boolean;
}

export const JobApplyForm = ({ jobTitle, open, onClose, onSubmit, loading }: JobApplyFormProps) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  const handleSubmit = async () => {
    if (!coverLetter.trim()) {
      toast.error('Veuillez écrire une lettre de motivation');
      return;
    }

    const success = await onSubmit({
      resume_url: resumeUrl || undefined,
      cover_letter: coverLetter
    });

    if (success) {
      setCoverLetter('');
      setResumeUrl('');
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="text-left mb-6">
          <SheetTitle>Postuler à l'offre</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {jobTitle}
          </SheetDescription>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="resume">CV (optionnel)</Label>
            <div className="relative">
              <Input
                id="resume"
                type="url"
                placeholder="Lien vers votre CV (Google Drive, Dropbox...)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="pl-10"
              />
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Vous pouvez partager un lien vers votre CV en ligne
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Lettre de motivation *</Label>
            <Textarea
              id="coverLetter"
              placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {coverLetter.length}/1000 caractères
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">💡 Conseils pour une bonne candidature</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Soyez concis et précis</li>
              <li>Mettez en avant vos compétences pertinentes</li>
              <li>Montrez votre motivation</li>
              <li>Relisez avant d'envoyer</li>
            </ul>
          </div>
        </motion.div>

        <div className="sticky bottom-0 left-0 right-0 pt-6 pb-2 bg-background border-t mt-6">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !coverLetter.trim()}
            >
              {loading ? 'Envoi...' : 'Envoyer ma candidature'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
