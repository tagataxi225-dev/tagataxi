import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  User,
  Settings,
  LogOut,
  Building2,
  ArrowLeftRight,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface ModernPartnerHeaderProps {
  partnerName?: string;
  companyName?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
  showMenu?: boolean;
  partnerType?: 'delivery' | 'auto' | null;
  partnerLogoUrl?: string;
}

export const ModernPartnerHeader = ({
  partnerName,
  companyName,
  notificationCount = 0,
  onMenuClick,
  showMenu = false,
  partnerType,
  partnerLogoUrl
}: ModernPartnerHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = partnerName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PA';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 dark:bg-card/80 border-b border-border/50 shadow-sm pt-safe-top"
    >
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left Section: Logo + Company */}
        <div className="flex items-center gap-4">
          {showMenu && onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
              onClick={() => navigate('/app/partenaire')}
            >
              <BrandLogo size={36} className="rounded-xl" />
            </motion.div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h1 className="font-bold text-foreground text-lg leading-none">
                {companyName || 'Espace Partenaire'}
              </h1>
              {partnerType === 'delivery' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  🚀 Delivery
                </span>
              )}
              {partnerType === 'auto' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  🚗 Auto
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              TAGA Partner Dashboard
            </p>
          </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationCount > 0 ? (
                <>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        Nouveau chauffeur inscrit
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Il y a 5 minutes
                      </p>
                    </motion.div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="ghost" size="sm" className="w-full">
                      Voir toutes les notifications
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aucune notification
                  </p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-emerald-500/20">
                  <AvatarImage src={partnerLogoUrl} alt={partnerName} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium truncate max-w-[150px]">
                  {companyName || partnerName || 'Mon compte'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl bg-background border shadow-lg z-50">
              <DropdownMenuLabel className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
                    <AvatarImage src={partnerLogoUrl} alt={partnerName} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{companyName || partnerName || 'Mon compte'}</p>
                    <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
                    {partnerType && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1",
                        partnerType === 'delivery' 
                          ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" 
                          : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      )}>
                        {partnerType === 'delivery' ? '🚀 Delivery' : '🚗 Auto'}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/app/partenaire?tab=profile')}>
                <User className="w-4 h-4 mr-2" />
                Mon profil
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/app/partenaire?tab=profile')}>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="sm:hidden"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 mr-2" />
                ) : (
                  <Moon className="w-4 h-4 mr-2" />
                )}
                Mode {theme === 'dark' ? 'clair' : 'sombre'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};
