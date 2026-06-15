import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Users, 
  Activity,
  Settings,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types alignés avec UniversalBottomNavigation
type PartnerTab = 'dashboard' | 'fleet' | 'drivers' | 'jobs' | 'analytics' | 'settings';

interface PartnerDesktopNavProps {
  activeTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
  className?: string;
}

const tabs = [
  { 
    id: 'dashboard' as PartnerTab, 
    label: 'Tableau de bord', 
    icon: Home,
    description: 'Statistiques et KPI'
  },
  { 
    id: 'fleet' as PartnerTab, 
    label: 'Flotte', 
    icon: Car,
    description: 'Gestion des véhicules'
  },
  { 
    id: 'drivers' as PartnerTab, 
    label: 'Drivers', 
    icon: Users,
    description: 'Gestion des conducteurs'
  },
  { 
    id: 'jobs' as PartnerTab, 
    label: 'Recrutement', 
    icon: Briefcase,
    description: 'Offres d\'emploi'
  },
  { 
    id: 'analytics' as PartnerTab, 
    label: 'Analytics', 
    icon: Activity,
    description: 'Rapports et statistiques'
  },
  { 
    id: 'settings' as PartnerTab, 
    label: 'Paramètres', 
    icon: Settings,
    description: 'Paramètres du compte'
  }
];

export const PartnerDesktopNav = ({ 
  activeTab, 
  onTabChange,
  className 
}: PartnerDesktopNavProps) => {
  return (
    <nav className={cn(
      "hidden lg:flex items-center gap-1 px-4 py-2",
      "backdrop-blur-xl bg-background/80",
      "border-b border-border/50",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "hover:bg-muted/50",
              isActive && "bg-primary/10"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon 
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )} 
            />
            
            <span 
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="desktopActiveTab"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};
