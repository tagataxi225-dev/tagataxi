import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';

interface ModernPartnerAuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const ModernPartnerAuthCard = ({ children, title, subtitle }: ModernPartnerAuthCardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 space-y-6"
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-gray-950 shadow-xl mb-4 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrandLogo size={60} />
            </motion.div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
            <Briefcase className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Espace Partenaires
            </span>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </motion.div>

        {/* Card principale avec glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <CardContent className="pt-6 pb-6">
              {children}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
