import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewMessagesButtonProps {
  count?: number;
  onClick: () => void;
}

export const NewMessagesButton: React.FC<NewMessagesButtonProps> = ({
  count = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
    >
      <Button
        onClick={onClick}
        size="sm"
        className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 pl-3 pr-2"
      >
        <ChevronDown className="h-4 w-4" />
        <span className="text-xs font-medium">
          {count > 0 ? `${count} nouveau${count > 1 ? 'x' : ''} message${count > 1 ? 's' : ''}` : 'Défiler vers le bas'}
        </span>
        {count > 0 && (
          <Badge 
            variant="secondary" 
            className="h-5 w-5 p-0 flex items-center justify-center ml-1 bg-primary-foreground/20"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </Button>
    </motion.div>
  );
};
