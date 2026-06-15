import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MobileVendorHeaderProps {
  title?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  children?: React.ReactNode;
}

export const MobileVendorHeader: React.FC<MobileVendorHeaderProps> = ({
  title = "Vendeur",
  notificationCount = 0,
  onNotificationClick,
  children
}) => {
  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {children && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                {children}
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <Button 
          variant="ghost" 
          size="sm"
          className="relative p-2"
          onClick={onNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};