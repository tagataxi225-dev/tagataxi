import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Upload, Phone, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VerificationHistoryTimelineProps {
  userId: string;
}

export const VerificationHistoryTimeline = ({ userId }: VerificationHistoryTimelineProps) => {
  const { data: history } = useQuery({
    queryKey: ['verificationHistory', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .or('activity_type.eq.verification_status_change,activity_type.eq.document_upload,activity_type.eq.phone_verification')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const getIcon = (activityType: string) => {
    switch (activityType) {
      case 'verification_status_change':
        return <UserCheck className="h-4 w-4" />;
      case 'document_upload':
        return <Upload className="h-4 w-4" />;
      case 'phone_verification':
        return <Phone className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColor = (activityType: string, description: string) => {
    if (description.includes('approuvé') || description.includes('verified')) {
      return 'text-green-600';
    }
    if (description.includes('rejeté') || description.includes('rejected')) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  if (!history || history.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        Aucun historique disponible
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Historique des actions</h3>
      <div className="relative border-l-2 border-muted pl-4 space-y-4">
        {history.map((event, index) => (
          <div key={event.id} className="relative">
            <div className={`absolute -left-[1.35rem] p-1.5 rounded-full bg-background border-2 ${getColor(event.activity_type, event.description)}`}>
              {getIcon(event.activity_type)}
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">{event.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(event.created_at), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </div>
              {event.metadata && typeof event.metadata === 'object' && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 text-xs bg-muted p-2 rounded">
                  {(event.metadata as any).admin_notes && (
                    <div><strong>Note admin :</strong> {(event.metadata as any).admin_notes}</div>
                  )}
                  {(event.metadata as any).old_status && (
                    <div>
                      <strong>Changement :</strong> {(event.metadata as any).old_status} → {(event.metadata as any).new_status}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
