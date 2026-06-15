/**
 * 🎯 Barre d'Actions Profil - Design Moderne Horizontal
 */

import { motion } from 'framer-motion';
import { Wallet, Gift, MoreHorizontal, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionBarProps {
  onReferralClick: () => void;
  onSupportClick: () => void;
  serviceType: 'taxi' | 'delivery';
}

export const FloatingActions = ({
  onReferralClick,
  onSupportClick,
  serviceType
}: ActionBarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const themeColor = serviceType === 'taxi' 
    ? 'bg-primary hover:bg-primary/90' 
    : 'bg-green-500 hover:bg-green-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 bg-card border border-border/50 rounded-2xl"
    >
      <div className="flex items-center gap-3">
        {/* Wallet */}
        <Button
          className={`flex-1 h-12 rounded-xl ${themeColor} text-white font-medium`}
          onClick={() => navigate('/app/chauffeur?tab=earnings')}
        >
          <Wallet className="w-5 h-5 mr-2" />
          {t('driver.wallet')}
        </Button>

        {/* Parrainage */}
        <Button
          variant="secondary"
          className="flex-1 h-12 rounded-xl font-medium"
          onClick={onReferralClick}
        >
          <Gift className="w-5 h-5 mr-2" />
          {t('driver.referral')}
        </Button>

        {/* Menu Plus */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSupportClick}>
              <Shield className="w-4 h-4 mr-2" />
              {t('driver.support_assistance')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={async () => await signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
