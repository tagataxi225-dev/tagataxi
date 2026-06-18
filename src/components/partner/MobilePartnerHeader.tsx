import React from "react";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import BrandLogo from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import NotificationCenter from "@/components/advanced/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface MobilePartnerHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export const MobilePartnerHeader: React.FC<MobilePartnerHeaderProps> = ({ 
  title = "Tableau de bord", 
  subtitle = "TAGA Taxi Partner",
  onMenuToggle 
}) => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useRealtimeNotifications();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo & Menu */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMenuToggle}
              className="p-2 h-auto rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <BrandLogo size={32} className="rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-body-md font-bold text-foreground truncate max-w-32">{title}</h1>
            <p className="text-caption text-muted-foreground truncate max-w-32">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="relative rounded-xl p-2 h-auto">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Centre de notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-2">
                <NotificationCenter />
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl p-2 h-auto">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem className="rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>Profil partenaire</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg text-destructive focus:text-destructive" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};