import { useAppReady } from '@/contexts/AppReadyContext';
import { Badge } from '@/components/ui/badge';
import { WifiOff } from 'lucide-react';

export const SessionStatusIndicator = () => {
  const { user } = useAppReady();
  
  if (!user) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Session expirée
      </Badge>
    );
  }
  
  return null;
};
