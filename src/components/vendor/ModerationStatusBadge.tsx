import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModerationStatusBadgeProps {
  status: string;
  className?: string;
}

export const ModerationStatusBadge: React.FC<ModerationStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const { t } = useLanguage();

  if (status === 'pending') {
    return (
      <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-300 ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        {t('moderation.pending')}
      </Badge>
    );
  }
  
  if (status === 'approved') {
    return (
      <Badge variant="default" className={`bg-green-100 text-green-800 border-green-300 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        {t('moderation.approved')}
      </Badge>
    );
  }
  
  if (status === 'rejected') {
    return (
      <Badge variant="destructive" className={className}>
        <XCircle className="w-3 h-3 mr-1" />
        {t('moderation.rejected')}
      </Badge>
    );
  }
  
  return null;
};
