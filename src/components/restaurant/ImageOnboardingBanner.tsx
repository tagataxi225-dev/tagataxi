import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

interface ImageOnboardingBannerProps {
  hasLogo: boolean;
  hasBanner: boolean;
  onAddImages: () => void;
}

export function ImageOnboardingBanner({ 
  hasLogo, 
  hasBanner, 
  onAddImages 
}: ImageOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  
  // Ne rien afficher si les images sont déjà là ou si fermé
  if ((hasLogo && hasBanner) || dismissed) return null;
  
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
      <CardContent className="p-4 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-600 rounded-full">
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-lg">
              Personnalisez votre profil ! 🎨
            </h3>
            <p className="text-sm text-muted-foreground">
              {!hasLogo && !hasBanner && "Ajoutez votre logo et bannière pour vous démarquer auprès des clients."}
              {hasLogo && !hasBanner && "Super logo ! N'oubliez pas d'ajouter une bannière."}
              {!hasLogo && hasBanner && "Belle bannière ! Complétez avec votre logo."}
            </p>
            
            <Button 
              onClick={onAddImages}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Ajouter mes images
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
