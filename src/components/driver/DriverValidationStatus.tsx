import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react';

interface DriverRequest {
  id: string;
  status: string;
  validation_level: string;
  validation_comments: string;
  partner_id: string | null;
  validated_by: string | null;
  validation_date: string | null;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  license_number: string;
}

interface ValidationHistory {
  id: string;
  validation_type: string;
  action: string;
  comments: string;
  created_at: string;
  validator_profile?: {
    display_name: string;
  };
}

export const DriverValidationStatus = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [driverRequest, setDriverRequest] = useState<DriverRequest | null>(null);
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDriverRequest();
      loadValidationHistory();
    }
  }, [user]);

  const loadDriverRequest = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('driver_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading driver request:', error);
      return;
    }

    setDriverRequest(data);
    setLoading(false);
  };

  const loadValidationHistory = async () => {
    if (!user || !driverRequest) return;

    const { data, error } = await supabase
      .from('validation_history')
      .select('*')
      .eq('request_id', driverRequest.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading validation history:', error);
      return;
    }

    // Load validator profiles separately
    const historyWithProfiles = await Promise.all(
      (data || []).map(async (entry) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', entry.validator_id)
          .maybeSingle();
        
        return {
          ...entry,
          validator_profile: profile
        };
      })
    );

    setValidationHistory(historyWithProfiles);
  };

  const submitForValidation = async () => {
    if (!driverRequest || !user) return;

    setSubmitting(true);

    try {
      // Update driver request status
      const { error: updateError } = await supabase
        .from('driver_requests')
        .update({
          status: 'pending_partner',
          validation_level: 'partner'
        })
        .eq('id', driverRequest.id);

      if (updateError) throw updateError;

      // Add validation history entry
      const { error: historyError } = await supabase
        .from('validation_history')
        .insert({
          request_id: driverRequest.id,
          validator_id: user.id,
          validation_type: 'driver',
          action: 'submitted',
          comments: 'Demande soumise pour validation partenaire'
        });

      if (historyError) throw historyError;

      toast({
        title: t('validation.submitted'),
        description: t('validation.submittedDescription'),
      });

      loadDriverRequest();
      loadValidationHistory();
    } catch (error) {
      console.error('Error submitting for validation:', error);
      toast({
        title: t('common.error'),
        description: t('validation.submitError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, validationLevel: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('validation.draft')}
        </Badge>;
      case 'pending_partner':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('validation.pendingPartner')}
        </Badge>;
      case 'pending_admin':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('validation.pendingAdmin')}
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {t('validation.approved')}
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t('validation.rejected')}
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  if (!driverRequest) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">{t('validation.noRequest')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('validation.status')}
            {getStatusBadge(driverRequest.status, driverRequest.validation_level)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{t('driver.vehicleType')}:</span>
              <p className="text-muted-foreground">{driverRequest.vehicle_type}</p>
            </div>
            <div>
              <span className="font-medium">{t('driver.vehicleModel')}:</span>
              <p className="text-muted-foreground">{driverRequest.vehicle_model}</p>
            </div>
            <div>
              <span className="font-medium">{t('driver.vehiclePlate')}:</span>
              <p className="text-muted-foreground">{driverRequest.vehicle_plate}</p>
            </div>
            <div>
              <span className="font-medium">{t('driver.licenseNumber')}:</span>
              <p className="text-muted-foreground">{driverRequest.license_number}</p>
            </div>
          </div>

          {driverRequest.validation_comments && (
            <div>
              <span className="font-medium text-sm">{t('validation.comments')}:</span>
              <p className="text-muted-foreground mt-1">{driverRequest.validation_comments}</p>
            </div>
          )}

          {driverRequest.status === 'pending' && (
            <Button 
              onClick={submitForValidation} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t('common.loading') : t('validation.submitForValidation')}
            </Button>
          )}
        </CardContent>
      </Card>

      {validationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('validation.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationHistory.map((entry) => (
                <div key={entry.id} className="border-l-2 border-muted pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {entry.validator_profile?.display_name || t('validation.unknown')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {t(`validation.${entry.validation_type}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{t(`validation.${entry.action}`)}:</span> {entry.comments}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};