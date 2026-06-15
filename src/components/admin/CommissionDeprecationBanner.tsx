import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const CommissionDeprecationBanner = () => {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('commission-banner-dismissed') === 'true'
  );
  const navigate = useNavigate();

  const handleDismiss = () => {
    localStorage.setItem('commission-banner-dismissed', 'true');
    setDismissed(true);
  };

  const handleLearnMore = () => {
    navigate('/admin?tab=subscriptions');
  };

  if (dismissed) return null;

  return (
    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      
      <AlertTitle className="text-orange-900 font-semibold flex items-center gap-2">
        🎫 Transition vers le système d'abonnements
        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
          Important
        </Badge>
      </AlertTitle>
      
      <AlertDescription className="text-orange-800 mt-2 space-y-3">
        <p>
          Le <strong>système de commissions est désormais déprécié</strong>. Tous les chauffeurs et livreurs 
          doivent désormais souscrire à des <strong>tickets d'abonnement digitaux</strong> pour se mettre en ligne 
          sur Tembea et effectuer des courses.
        </p>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Système actif :</span>
            <span>Abonnements digitaux 🎫</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="font-medium">Ancien système :</span>
            <span className="line-through">Commissions par course</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={handleLearnMore}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            Gérer les abonnements
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDismiss}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            J'ai compris
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
