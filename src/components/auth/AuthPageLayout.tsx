import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BrandLogo from '@/components/brand/BrandLogo';

interface AuthPageLayoutProps {
  /** Type de rôle pour adapter le style */
  role: 'client' | 'driver' | 'partner' | 'restaurant';
  /** Titre de la page (ex: "Client", "Chauffeur") */
  title: string;
  /** Description de la page */
  description: string;
  /** Icône du badge */
  icon: ReactNode;
  /** Classes Tailwind pour le gradient de fond */
  gradient: string;
  /** Classes Tailwind pour la couleur primaire (hover, focus) */
  primaryColor: string;
  /** Contenu du formulaire */
  children: ReactNode;
}

/**
 * Layout réutilisable pour toutes les pages d'authentification
 * Garantit une cohérence visuelle entre tous les espaces
 */
export const AuthPageLayout = ({
  role,
  title,
  description,
  icon,
  gradient,
  primaryColor,
  children
}: AuthPageLayoutProps) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} dark:from-background dark:to-background flex items-center justify-center p-4`}>
      <div className="w-full max-w-md relative z-10">
        {/* En-tête épuré avec logo et badge */}
        <div className="text-center mb-10 space-y-6 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white dark:bg-card shadow-xl mb-6 overflow-hidden hover:scale-105 transition-transform duration-300">
            <BrandLogo size={112} />
          </div>
          
          {/* Badge professionnel */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-muted mb-4">
            {icon}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Espace {title}
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            TAGA {title === 'Client' ? '' : title}
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {/* Carte de connexion */}
        <Card className="shadow-xl bg-white dark:bg-card border border-gray-200 dark:border-border animate-scale-in">
          <CardContent className="pt-8 pb-6 relative z-10">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
