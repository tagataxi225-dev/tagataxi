import { motion } from 'framer-motion';
import { ClientLoginForm } from "./ClientLoginForm";
import { ArrowLeft, Car, Handshake, UtensilsCrossed, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthLanguageSelector } from './AuthLanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthBackground } from './AuthBackground';
import { AuthCard } from './AuthCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
} as const;

const professionalSpaces = [
  { 
    key: 'driver', 
    icon: Car, 
    path: '/driver/auth',
    gradient: 'from-blue-500 to-indigo-600',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    borderHover: 'hover:border-blue-300 dark:hover:border-blue-700'
  },
  { 
    key: 'partner', 
    icon: Handshake, 
    path: '/partner/auth',
    gradient: 'from-emerald-500 to-teal-600',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700'
  },
  { 
    key: 'restaurant', 
    icon: UtensilsCrossed, 
    path: '/restaurant/auth',
    gradient: 'from-amber-500 to-orange-600',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    borderHover: 'hover:border-amber-300 dark:hover:border-amber-700'
  }
];

export const UnifiedAuthPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getLabel = (key: string) => {
    switch(key) {
      case 'driver': return t('auth.driver_deliverer');
      case 'partner': return t('role.partner');
      case 'restaurant': return t('role.restaurant');
      default: return '';
    }
  };

  return (
    <div className="min-h-dvh flex flex-col relative pt-safe-top">
      {/* Animated Background */}
      <AuthBackground />

      {/* Language Selector */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] right-4 sm:right-6 z-50"
      >
        <AuthLanguageSelector />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md flex flex-col space-y-4"
        >
          {/* Header with Logo */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            {/* Logo — clean, no glow */}
            <div className="flex justify-center">
              <div className="relative p-3 bg-white dark:bg-card rounded-2xl shadow-lg border border-white/50 dark:border-border/50">
                <BrandLogo size={56} />
              </div>
            </div>

            {/* Simple Title */}
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-gray-900 dark:from-white dark:via-emerald-300 dark:to-white bg-clip-text text-transparent">
              Connexion
            </h1>
          </motion.div>

          {/* Auth Card - Premium Glassmorphism */}
          <AuthCard delay={0.3}>
            <ClientLoginForm />
          </AuthCard>

          {/* Professional Spaces Section */}
          <motion.div variants={itemVariants} className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {t('auth.professional_question')}
              </p>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {professionalSpaces.map((space, index) => {
                const Icon = space.icon;
                return (
                  <motion.button
                    key={space.key}
                    onClick={() => navigate(space.path)}
                    className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border/50 bg-white/50 dark:bg-card/50 backdrop-blur-sm transition-all duration-300 ${space.bgHover} ${space.borderHover}`}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {/* Icon with gradient background */}
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${space.gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Label */}
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                      {getLabel(space.key)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-6 flex justify-center"
      >
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3 w-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          {t('auth.back_home')}
        </Button>
      </motion.div>
    </div>
  );
};
