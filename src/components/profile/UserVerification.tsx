import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Phone, FileText, CheckCircle, Upload, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserVerificationData {
  id: string;
  phone_verified: boolean;
  identity_verified: boolean;
  identity_document_url: string | null;
  verification_status: string;
}

export const UserVerification = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<UserVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    if (user) {
      loadVerificationStatus();
    }
  }, [user]);

  const loadVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial verification record
        const { data: newData, error: insertError } = await supabase
          .from('user_verification')
          .insert({ user_id: user?.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setVerification(newData as unknown as UserVerificationData);
      } else {
        setVerification(data as unknown as UserVerificationData);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      setSendingCode(true);
      // Simulate sending SMS verification code
      // In real implementation, this would trigger an SMS service
      
      toast.success("Code de vérification envoyé à votre numéro");

      // For demo purposes, we'll auto-verify after 3 seconds
      setTimeout(async () => {
        await supabase
          .from('user_verification')
          .update({ phone_verified: true })
          .eq('user_id', user?.id);
        
        loadVerificationStatus();
        
        toast.success("✅ Numéro de téléphone vérifié avec succès!");
      }, 3000);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error("Impossible d'envoyer le code de vérification");
    } finally {
      setSendingCode(false);
    }
  };

  const uploadIdentityDocument = async (file: File) => {
    if (!user) {
      console.error('❌ No user authenticated');
      toast.error("Vous devez être connecté pour uploader un document");
      return;
    }

    try {
      setUploadingDocument(true);
      
      console.log('📤 Starting document upload...', {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
      }

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/identity_${timestamp}.${fileExt}`;
      
      console.log('📁 File path:', filePath);

      // Upload to the identity-documents bucket
      console.log('⬆️ Uploading to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadData);

      // Update verification record with document path
      console.log('💾 Updating database...');
      const { data: updateData, error: updateError } = await supabase
        .from('user_verification')
        .update({ 
          identity_document_url: filePath,
          verification_status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw new Error(`Erreur DB: ${updateError.message}`);
      }

      console.log('✅ Database updated:', updateData);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'identity_verification_submitted',
        description: 'Document d\'identité soumis pour validation',
        metadata: {
          file_path: filePath,
          file_size: file.size,
          file_type: file.type
        }
      });

      toast.success("📄 Document téléchargé avec succès! Un admin va vérifier votre identité sous 24-48h.", {
        duration: 5000
      });

      console.log('🎉 Upload process completed successfully');
      await loadVerificationStatus();
      
    } catch (error: any) {
      console.error('❌ Error uploading document:', error);
      toast.error(error.message || "Impossible de télécharger le document. Veuillez réessayer.", {
        duration: 5000
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux (max 10MB)");
        return;
      }
      uploadIdentityDocument(file);
    }
  };

  const getVerificationProgress = () => {
    if (!verification) return 0;
    let progress = 0;
    if (verification.phone_verified) progress += 50;
    if (verification.identity_verified) progress += 50;
    return progress;
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div id="security-section" className="space-y-4">
      {verification?.verification_status === 'pending_review' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Vérification en cours</p>
                <p className="text-sm text-blue-700">
                  Votre document est en cours de vérification par notre équipe. Vous recevrez une notification sous 24-48h.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vérification du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm text-muted-foreground">
                {getVerificationProgress()}%
              </span>
            </div>
            <Progress value={getVerificationProgress()} className="h-2" />
          </div>

          {/* Phone Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div>
                  <h3 className="font-medium">Vérification du téléphone</h3>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez votre numéro de téléphone par SMS
                  </p>
                </div>
              </div>
              {verification?.phone_verified ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              ) : (
                <Badge variant="secondary">En attente</Badge>
              )}
            </div>

            {!verification?.phone_verified && (
              <div className="ml-8 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Code de vérification"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="max-w-40"
                  />
                  <Button
                    onClick={sendVerificationCode}
                    disabled={sendingCode}
                  >
                    {sendingCode ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Identity Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="font-medium">Vérification d'identité</h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une pièce d'identité valide
                  </p>
                </div>
              </div>
              {verification?.identity_verified ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              ) : verification?.identity_document_url ? (
                <Badge variant="secondary">En cours de vérification</Badge>
              ) : (
                <Badge variant="outline">Non vérifié</Badge>
              )}
            </div>

            {!verification?.identity_verified && (
              <div className="ml-8">
                <Button
                  variant="outline"
                  disabled={uploadingDocument}
                  asChild
                >
                  <label htmlFor="identity-document-upload" className="cursor-pointer">
                    {uploadingDocument ? (
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {uploadingDocument ? 'Téléchargement...' : 'Télécharger un document'}
                  </label>
                </Button>
                <input
                  id="identity-document-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés: JPG, PNG, PDF (max 10MB)
                </p>
              </div>
            )}
          </div>

          {verification?.identity_document_url && (
            <div className="ml-8">
              <p className="text-sm text-green-600">
                ✓ Document téléchargé, vérification en cours
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};