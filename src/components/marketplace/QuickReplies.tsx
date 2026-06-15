import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickRepliesProps {
  onSelect: (message: string) => void;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  const { t } = useLanguage();
  
  const DEFAULT_REPLIES = [
    t('marketplace.quick_reply_final_price'),
    t('marketplace.quick_reply_shipping'),
    t('marketplace.quick_reply_warranty'),
    t('marketplace.quick_reply_condition'),
    t('marketplace.quick_reply_negotiable')
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {DEFAULT_REPLIES.map((reply) => (
        <Button
          key={reply}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="whitespace-nowrap text-xs"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};
