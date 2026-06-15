import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react';

interface DriverRequest {
  id: string;
  user_id: string;
  status: string;
  validation_level: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  license_number: string;
  insurance_number: string;
  created_at: string;
  driver_profile?: {
    display_name: string;
    phone_number: string;
  };
}

export const DriverValidationManager = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [driverRequests, setDriverRequests] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const [validationComments, setValidationComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDriverRequests();
    }
  }, [user]);

  const loadDriverRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('driver_requests')
      .select('*')
      .eq('partner_id', user.id)
      .eq('status', 'pending_partner')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading driver requests:', error);
      return;
    }

    // Load driver profiles separately
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone_number')
          .eq('user_id', request.user_id)
          .maybeSingle();
        
        return {
          ...request,
          driver_profile: profile
        };
      })
    );

    setDriverRequests(requestsWithProfiles);
    setLoading(false);
  };

  const handleValidation = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user || !validationComments.trim()) {
      toast({
        title: t('common.error'),
        description: t('validation.commentsRequired'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Update driver request
      const { error: updateError } = await supabase
        .from('driver_requests')
        .update({
          status: action === 'approved' ? 'pending_admin' : 'rejected',
          validation_level: action === 'approved' ? 'admin' : 'partner',
          validated_by: user.id,
          validation_date: new Date().toISOString(),
          validation_comments: validationComments
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add validation history entry
      const { error: historyError } = await supabase
        .from('validation_history')
        .insert({
          request_id: requestId,
          validator_id: user.id,
          validation_type: 'partner',
          action,
          comments: validationComments
        });

      if (historyError) throw historyError;

      toast({
        title: t('validation.success'),
        description: t(`validation.${action}Success`),
      });

      setValidationComments('');
      setSelectedRequest(null);
      loadDriverRequests();
    } catch (error) {
      console.error('Error validating driver request:', error);
      toast({
        title: t('common.error'),
        description: t('validation.error'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('validation.driverRequests')}
            <Badge variant="secondary">{driverRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {driverRequests.length === 0 ? (
            <p className="text-muted-foreground">{t('validation.noRequests')}</p>
          ) : (
            <div className="space-y-4">
              {driverRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">
                        {request.driver_profile?.display_name || t('validation.unknown')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {request.driver_profile?.phone_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('validation.pendingPartner')}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t('validation.review')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{t('validation.reviewRequest')}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedRequest && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="font-medium text-sm">{t('driver.vehicleType')}:</span>
                                  <p className="text-muted-foreground">{selectedRequest.vehicle_type}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-sm">{t('driver.vehicleModel')}:</span>
                                  <p className="text-muted-foreground">{selectedRequest.vehicle_model}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-sm">{t('driver.vehiclePlate')}:</span>
                                  <p className="text-muted-foreground">{selectedRequest.vehicle_plate}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-sm">{t('driver.licenseNumber')}:</span>
                                  <p className="text-muted-foreground">{selectedRequest.license_number}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-sm">{t('driver.insuranceNumber')}:</span>
                                  <p className="text-muted-foreground">{selectedRequest.insurance_number}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-sm">{t('validation.submittedAt')}:</span>
                                  <p className="text-muted-foreground">
                                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="font-medium text-sm">
                                  {t('validation.comments')} *
                                </label>
                                <Textarea
                                  value={validationComments}
                                  onChange={(e) => setValidationComments(e.target.value)}
                                  placeholder={t('validation.commentsPlaceholder')}
                                  rows={4}
                                />
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleValidation(selectedRequest.id, 'approved')}
                                  disabled={submitting || !validationComments.trim()}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {submitting ? t('common.loading') : t('validation.approve')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleValidation(selectedRequest.id, 'rejected')}
                                  disabled={submitting || !validationComments.trim()}
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {submitting ? t('common.loading') : t('validation.reject')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>{request.vehicle_type}</span>
                    <span>{request.vehicle_model}</span>
                    <span>{request.vehicle_plate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};