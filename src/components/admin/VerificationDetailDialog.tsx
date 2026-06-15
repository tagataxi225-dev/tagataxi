import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, Phone, Mail, Calendar, ZoomIn, RotateCw, ShieldCheck, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { VerificationHistoryTimeline } from './VerificationHistoryTimeline';
import { DocumentPreview } from './DocumentPreview';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VerificationDetailDialogProps {
  verification: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationDetailDialog = ({ verification, open, onClose, onSuccess }: VerificationDetailDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [phoneVerified, setPhoneVerified] = useState(verification.phone_verified);
  const [identityVerified, setIdentityVerified] = useState(verification.identity_verified);
  const [verificationLevel, setVerificationLevel] = useState(verification.verification_level);
  const [adminNotes, setAdminNotes] = useState(verification.admin_notes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const handleAction = async (action: 'approve' | 'reject' | 'request_info') => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-account', {
        body: {
          user_id: verification.user_id,
          action,
          phone_verified: phoneVerified,
          identity_verified: identityVerified,
          verification_level: verificationLevel,
          admin_notes: adminNotes,
          rejection_reason: action === 'reject' ? rejectionReason : undefined
        }
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? '✅ Compte approuvé' : 
               action === 'reject' ? '❌ Compte rejeté' : 
               '⚠️ Informations demandées',
        description: action === 'approve' 
          ? 'L\'utilisateur peut maintenant vendre sur la marketplace'
          : action === 'reject'
          ? 'L\'utilisateur a été notifié du rejet'
          : 'L\'utilisateur a été notifié de fournir plus d\'informations'
      });

      onSuccess();
    } catch (error: any) {
      console.error('Verification action error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter la demande',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestDocument = async () => {
    setIsProcessing(true);
    try {
      // Créer une notification pour demander le document
      const { error: notifError } = await supabase
        .from('delivery_notifications')
        .insert({
          user_id: verification.user_id,
          notification_type: 'verification_request',
          title: '📄 Document requis pour vendre',
          message: 'Pour pouvoir vendre sur la marketplace, veuillez télécharger votre document d\'identité dans votre profil.',
          metadata: {
            action: 'upload_document',
            admin_id: user?.id,
            requested_at: new Date().toISOString()
          }
        });

      if (notifError) throw notifError;

      // Logger l'action
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        activity_type: 'document_request',
        description: 'Demande de document d\'identité envoyée',
        metadata: {
          target_user_id: verification.user_id,
          target_email: verification.clients?.email
        }
      });

      toast({
        title: '✅ Demande envoyée',
        description: 'L\'utilisateur a été notifié de télécharger son document'
      });

      onSuccess();
    } catch (error: any) {
      console.error('Request document error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer la demande',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualApproval = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_approve_verification_manual', {
        p_user_id: verification.user_id,
        p_admin_notes: adminNotes || 'Approbation manuelle pour test marketplace'
      }) as { data: any; error: any };

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Échec de l\'approbation');

      toast({
        title: '✅ Compte vérifié manuellement',
        description: 'L\'utilisateur peut maintenant vendre sur la marketplace (mode test)',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Manual approval error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'approuver manuellement',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Vérification du compte
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* User Information */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">Informations utilisateur</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{verification.clients?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{verification.clients?.phone_number || 'Non renseigné'}</span>
                  {verification.phone_verified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                      <XCircle className="h-3 w-3 mr-1" />Non vérifié
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Inscrit {formatDistanceToNow(new Date(verification.created_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Alertes informations manquantes */}
            {(!verification.clients?.phone_number || !verification.identity_document_url) && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Informations manquantes
                    </h4>
                    <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                      {!verification.clients?.phone_number && (
                        <li>• Numéro de téléphone manquant</li>
                      )}
                      {!verification.identity_document_url && (
                        <li>• Document d'identité non fourni</li>
                      )}
                    </ul>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                      Utilisez le bouton "Demander Document" ci-dessous pour notifier l'utilisateur
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Preview */}
            <div className="space-y-2">
              <h3 className="font-semibold">Document d'identité</h3>
              {verification.identity_document_url ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Document fourni
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 2))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DocumentPreview 
                    documentPath={verification.identity_document_url}
                    userId={verification.user_id}
                    zoom={imageZoom}
                    rotation={imageRotation}
                  />
                </>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Aucun document d'identité fourni
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    L'utilisateur n'a pas encore téléchargé son document
                  </p>
                </div>
              )}
            </div>

            {/* History Timeline */}
            <VerificationHistoryTimeline userId={verification.user_id} />
          </div>

          {/* Validation Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Formulaire de validation</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="phone"
                  checked={phoneVerified}
                  onCheckedChange={(checked) => setPhoneVerified(!!checked)}
                />
                <Label htmlFor="phone" className="cursor-pointer">
                  Téléphone vérifié
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="identity"
                  checked={identityVerified}
                  onCheckedChange={(checked) => setIdentityVerified(!!checked)}
                />
                <Label htmlFor="identity" className="cursor-pointer">
                  Identité vérifiée
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Niveau de vérification</Label>
                <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="basic">Basique</SelectItem>
                    <SelectItem value="full">Complète</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes admin (optionnel)</Label>
                <Textarea
                  placeholder="Ajoutez vos observations..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {verification.verification_status === 'pending_review' && (
                <div className="space-y-2">
                  <Label className="text-red-600">Raison du rejet (si applicable)</Label>
                  <Textarea
                    placeholder="Expliquez pourquoi ce document est rejeté..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-6 mt-6 bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 text-center">Actions de validation</h3>
              <div className="space-y-3 sm:space-y-4">
                {/* Approbation manuelle TEST (Super Admin only) */}
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-400 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-yellow-200 text-yellow-900 border-yellow-400">
                      MODE TEST
                    </Badge>
                    <span className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                      Approbation sans vérification de documents
                    </span>
                  </div>
                  <Button
                    onClick={handleManualApproval}
                    disabled={isProcessing}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold h-12"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5 mr-2" />
                        Approuver Manuellement (Test)
                      </>
                    )}
                  </Button>
                </div>

                <div className="h-px bg-border my-2" />

                <Button
                  onClick={() => handleAction('approve')}
                  disabled={isProcessing || !verification.identity_document_url}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approuver le compte
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleAction('reject')}
                  disabled={isProcessing || !rejectionReason}
                  variant="destructive"
                  className="w-full font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 mr-2" />
                      Rejeter avec raison
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleAction('request_info')}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-orange-700 border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Demander plus d'infos
                    </>
                  )}
                </Button>

                {/* Bouton spécifique pour demander le document */}
                {!verification.identity_document_url && (
                  <Button
                    onClick={handleRequestDocument}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Demander Document
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
