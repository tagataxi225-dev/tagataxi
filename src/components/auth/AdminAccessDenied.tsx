import { Shield, AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import BrandLogo from '@/components/brand/BrandLogo';

interface AdminAccessDeniedProps {
  detectedRoles?: string[];
  requiredRole?: string;
}

export const AdminAccessDenied = ({ 
  detectedRoles = [], 
  requiredRole = 'admin' 
}: AdminAccessDeniedProps) => {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  const handleGoBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-6 overflow-hidden">
            <BrandLogo size={72} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              Accès Refusé
            </span>
          </div>
        </div>

        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 animate-scale-in">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Accès non autorisé
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous n'avez pas les permissions nécessaires pour accéder à l'espace administrateur.
              </p>
            </div>

            {/* Diagnostic info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rôle requis :</span>
                <span className="font-mono text-red-600 dark:text-red-400">{requiredRole}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Vos rôles :</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {detectedRoles.length > 0 ? detectedRoles.join(', ') : 'Aucun'}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si vous pensez qu'il s'agit d'une erreur, contactez un super-administrateur pour obtenir l'accès.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full h-11"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter et réessayer
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
