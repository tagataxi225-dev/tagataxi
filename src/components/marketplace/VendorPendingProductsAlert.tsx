import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VendorPendingProductsAlertProps {
  pendingCount: number;
  onViewProducts?: () => void;
}

export const VendorPendingProductsAlert = ({ 
  pendingCount, 
  onViewProducts 
}: VendorPendingProductsAlertProps) => {
  if (pendingCount === 0) return null;

  return (
    <Alert className="border-yellow-500/50 bg-yellow-50/10">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="flex items-center gap-2">
        Produits en Attente de Modération
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
          {pendingCount}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div className="text-sm">
          Vous avez <strong>{pendingCount}</strong> produit{pendingCount > 1 ? 's' : ''} en attente 
          de validation par notre équipe. Ils seront visibles sur la marketplace une fois approuvés.
        </div>
        
        <div className="bg-blue-50/50 p-3 rounded-md text-sm space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">Processus de Modération</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-xs">
                <li>Vérification de la qualité et conformité du produit</li>
                <li>Validation des images et descriptions</li>
                <li>Délai moyen: 24-48 heures</li>
              </ul>
            </div>
          </div>
        </div>

        {onViewProducts && (
          <Button 
            onClick={onViewProducts} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Voir mes produits
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
