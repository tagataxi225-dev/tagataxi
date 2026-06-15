/**
 * 📄 Composant upload documents chauffeur
 * Réutilise DocumentUpload avec logique spécifique driver
 */

import React, { useState } from 'react';
import { DocumentUpload } from '@/components/partner/shared/DocumentUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDriverDocuments, DOCUMENT_TYPES } from '@/hooks/useDriverDocuments';
import { FileText, CheckCircle, Clock, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DriverDocumentUploaderProps {
  serviceType: 'taxi' | 'delivery';
}

export const DriverDocumentUploader: React.FC<DriverDocumentUploaderProps> = ({ 
  serviceType 
}) => {
  const { documents, uploadDocument, completionRate, needsAttention } = useDriverDocuments();
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [viewDocument, setViewDocument] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: 'Validé', variant: 'default' as const },
      pending: { label: 'En attente', variant: 'secondary' as const },
      rejected: { label: 'Rejeté', variant: 'destructive' as const },
      expired: { label: 'Expiré', variant: 'destructive' as const }
    };

    const { label, variant } = config[status as keyof typeof config] || 
      { label: 'Non fourni', variant: 'outline' as const };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleUpload = async (file: File, documentType: string) => {
    const expiresAt = expiryDates[documentType] || undefined;
    
    const result = await uploadDocument.mutateAsync({
      file,
      documentType: documentType as any,
      expiresAt
    });

    return { 
      success: true, 
      url: result.url 
    };
  };

  const serviceColor = serviceType === 'taxi' ? 'orange' : 'blue';

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <Card className={`bg-gradient-to-br from-${serviceColor}-500 to-${serviceColor}-600 text-white border-0`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mes documents
            </span>
            <span className="text-2xl font-bold">{completionRate}%</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-white h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm opacity-90">
              {documents.filter(d => d.status === 'approved').length} sur {documents.length} documents validés
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Alerte documents expirés */}
      {needsAttention > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">
                {needsAttention} document{needsAttention > 1 ? 's nécessitent' : ' nécessite'} votre attention
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des documents */}
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {doc.label}
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      {doc.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expire le {new Date(doc.expires_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
                {doc.rejection_reason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    ❌ Motif de rejet: {doc.rejection_reason}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Upload component */}
                <DocumentUpload
                  label={doc.url ? "Remplacer le document" : "Téléverser le document"}
                  description={`Formats acceptés: JPG, PNG, PDF (max 5MB)`}
                  acceptedTypes={['image/*', 'application/pdf']}
                  maxSizeMB={5}
                  onUpload={(file) => handleUpload(file, doc.type)}
                  existingUrl={doc.url}
                />

                {/* Date d'expiration pour certains documents */}
                {(['license', 'insurance', 'technical_control'].includes(doc.type)) && (
                  <div className="space-y-2">
                    <Label htmlFor={`expiry-${doc.type}`}>
                      Date d'expiration {doc.required && '*'}
                    </Label>
                    <Input
                      id={`expiry-${doc.type}`}
                      type="date"
                      value={expiryDates[doc.type] || doc.expires_at || ''}
                      onChange={(e) => setExpiryDates(prev => ({
                        ...prev,
                        [doc.type]: e.target.value
                      }))}
                      className="max-w-xs"
                    />
                  </div>
                )}

                {/* Bouton voir document */}
                {doc.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDocument(doc.url!)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir le document
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal aperçu document */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aperçu du document</DialogTitle>
          </DialogHeader>
          {viewDocument && (
            <div className="overflow-auto">
              {viewDocument.endsWith('.pdf') ? (
                <iframe 
                  src={viewDocument} 
                  className="w-full h-[70vh]"
                  title="Document preview"
                />
              ) : (
                <img 
                  src={viewDocument} 
                  alt="Document" 
                  className="w-full h-auto"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 Vos documents sont vérifiés sous 24h ouvrées. Vous serez notifié par email et notification push.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
