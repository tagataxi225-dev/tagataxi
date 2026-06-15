import { useState } from 'react';
import { Home, Building, MapPin, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePlaces } from '@/hooks/usePlaces';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import confetti from 'canvas-confetti';

interface QuickPlaceSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function QuickPlaceSetup({ open, onOpenChange, onComplete }: QuickPlaceSetupProps) {
  const { toast } = useToast();
  const { addPlace, loading: savingPlaces } = usePlaces();
  const { searchLocations, searchLoading } = useSmartGeolocation();
  
  const [homeQuery, setHomeQuery] = useState('');
  const [workQuery, setWorkQuery] = useState('');
  const [homeResult, setHomeResult] = useState<any>(null);
  const [workResult, setWorkResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleHomeSearch = async () => {
    if (!homeQuery.trim()) return;
    
    try {
      const results = await searchLocations(homeQuery);
      if (results && results.length > 0) {
        setHomeResult(results[0]);
        toast({
          title: "✓ Adresse trouvée",
          description: results[0].address,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver cette adresse",
        variant: "destructive"
      });
    }
  };

  const handleWorkSearch = async () => {
    if (!workQuery.trim()) return;
    
    try {
      const results = await searchLocations(workQuery);
      if (results && results.length > 0) {
        setWorkResult(results[0]);
        toast({
          title: "✓ Adresse trouvée",
          description: results[0].address,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver cette adresse",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!homeResult && !workResult) {
      toast({
        title: "Attention",
        description: "Veuillez définir au moins une adresse",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      if (homeResult) {
        await addPlace({
          name: 'Maison',
          address: homeResult.address,
          coordinates: { lat: homeResult.lat, lng: homeResult.lng },
          place_type: 'home'
        });
      }
      
      if (workResult) {
        await addPlace({
          name: 'Travail',
          address: workResult.address,
          coordinates: { lat: workResult.lat, lng: workResult.lng },
          place_type: 'work'
        });
      }

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "🎉 Lieux favoris enregistrés !",
        description: `${homeResult ? 'Maison' : ''}${homeResult && workResult ? ' et ' : ''}${workResult ? 'Travail' : ''} configuré${(homeResult && workResult) ? 's' : ''}`,
      });

      onComplete?.();
      onOpenChange(false);
      
      // Reset form
      setHomeQuery('');
      setWorkQuery('');
      setHomeResult(null);
      setWorkResult(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les lieux",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Configurer vos lieux favoris
          </DialogTitle>
          <DialogDescription>
            Gagnez du temps en enregistrant votre domicile et lieu de travail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Home Address */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <Home className="w-4 h-4 text-blue-600" />
              Maison
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={homeQuery}
                onChange={(e) => setHomeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleHomeSearch();
                }}
                placeholder="Gombe, Kinshasa..."
                className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <Button
                onClick={() => {
                  handleHomeSearch();
                  triggerHaptic();
                }}
                disabled={!homeQuery.trim() || searchLoading}
                size="sm"
                variant="outline"
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              </Button>
            </div>
            <AnimatePresence>
              {homeResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-600">Adresse confirmée</p>
                      <p className="text-xs text-muted-foreground mt-1">{homeResult.address}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Work Address */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <Building className="w-4 h-4 text-purple-600" />
              Travail
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workQuery}
                onChange={(e) => setWorkQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWorkSearch();
                }}
                placeholder="Centre-ville, Gombe..."
                className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <Button
                onClick={() => {
                  handleWorkSearch();
                  triggerHaptic();
                }}
                disabled={!workQuery.trim() || searchLoading}
                size="sm"
                variant="outline"
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              </Button>
            </div>
            <AnimatePresence>
              {workResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-600">Adresse confirmée</p>
                      <p className="text-xs text-muted-foreground mt-1">{workResult.address}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              triggerHaptic();
            }}
            className="flex-1"
            disabled={saving}
          >
            Plus tard
          </Button>
          <Button
            onClick={() => {
              handleSave();
              triggerHaptic();
            }}
            disabled={(!homeResult && !workResult) || saving}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
