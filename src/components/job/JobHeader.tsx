import { ArrowLeft, Bell, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface JobHeaderProps {
  onBack: () => void;
  savedCount?: number;
  notificationCount?: number;
  onSavedClick?: () => void;
}

export const JobHeader = ({ onBack, savedCount = 0, notificationCount = 0, onSavedClick }: JobHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Tembea Job
            </h1>
            <p className="text-xs text-muted-foreground">Trouvez votre prochain emploi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedCount > 0 && onSavedClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSavedClick}
              className="relative hover:bg-primary/10"
            >
              <Heart className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {savedCount}
              </Badge>
            </Button>
          )}
          
          {notificationCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
