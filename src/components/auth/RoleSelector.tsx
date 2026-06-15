import { User, Car } from 'lucide-react';
import { UserRole } from '@/types/roles';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  availableRoles: UserRole[];
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole | null;
}

const roleConfig = {
  client: {
    name: 'Client',
    description: 'Réserver des courses et commander',
    icon: User,
    gradient: 'from-red-500 via-red-600 to-pink-600',
    emoji: '👤'
  },
  driver: {
    name: 'Chauffeur / Livreur',
    description: 'Transporter et livrer',
    icon: Car,
    gradient: 'from-orange-500 via-amber-600 to-yellow-600',
    emoji: '🚗'
  }
};

export const RoleSelector = ({ availableRoles, onRoleSelect, selectedRole }: RoleSelectorProps) => {
  // Filtrer uniquement client et driver
  const displayedRoles = availableRoles.filter(role => role === 'client' || role === 'driver');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
      {displayedRoles.map((role) => {
        const config = roleConfig[role];
        const Icon = config.icon;
        const isSelected = selectedRole === role;
        
        return (
          <button
            key={role}
            onClick={() => onRoleSelect(role)}
            className={cn(
              "group relative overflow-hidden rounded-3xl p-8 transition-all duration-300",
              "bg-gradient-to-br shadow-lg hover:shadow-2xl hover:scale-105",
              "border-2 border-transparent",
              config.gradient,
              isSelected && "ring-4 ring-white/50 scale-105"
            )}
          >
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              {/* Emoji géant */}
              <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                {config.emoji}
              </div>
              
              {/* Titre */}
              <h3 className="text-2xl font-bold text-white">
                {config.name}
              </h3>
              
              {/* Description */}
              <p className="text-white/90 text-sm font-medium">
                {config.description}
              </p>
              
              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold text-sm">
                  ✓ Sélectionné
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
