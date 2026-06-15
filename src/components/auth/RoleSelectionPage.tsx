import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, User, Building, Shield, Package } from 'lucide-react';

interface RoleSelectionPageProps {
  onRoleSelect: (role: string) => void;
}

const roles = [
  {
    id: 'simple_user_client',
    name: 'Client',
    description: 'Réserver des courses et commander des livraisons',
    icon: User,
    color: 'bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
  },
  {
    id: 'taxi_driver',
    name: 'Chauffeur Taxi',
    description: 'Transport de passagers • Services moto, eco, confort, premium',
    icon: Car,
    color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40'
  },
  {
    id: 'delivery_driver',
    name: 'Livreur',
    description: 'Livraison de colis • Services flash, flex, maxicharge',
    icon: Package,
    color: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/40'
  }
];

// Rôles masqués pour l'interface publique (accessible via URLs dédiées)
const hiddenRoles = [
  {
    id: 'partenaire',
    name: 'Partenaire',
    description: 'Gérer une flotte de véhicules',
    icon: Building,
    color: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'admin',
    name: 'Administrateur',
    description: 'Gérer la plateforme',
    icon: Shield,
    color: 'bg-red-50 hover:bg-red-100'
  }
];

export const RoleSelectionPage = ({ onRoleSelect }: RoleSelectionPageProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choisissez votre type de compte
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Sélectionnez le type de compte qui correspond à votre utilisation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'ring-2 ring-primary dark:ring-primary/80 shadow-lg dark:shadow-primary/20'
                    : 'hover:shadow-md dark:hover:shadow-lg'
                } ${role.color}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="h-8 w-8 text-primary dark:text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{role.name}</CardTitle>
                  <CardDescription className="text-center text-muted-foreground dark:text-gray-300">
                    {role.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
            className="px-8"
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};