/**
 * 📄 Section documents réutilisable - Fonctionnelle avec upload
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle, Clock, XCircle, Upload, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDriverDocuments, DriverDocument } from '@/hooks/useDriverDocuments';
import { DocumentUploadModal } from './DocumentUploadModal';

interface DocumentsSectionProps {
  serviceType: 'taxi' | 'delivery';
}

export const DocumentsSection = ({ serviceType }: DocumentsSectionProps) => {
  const { documents, completionRate, loading } = useDriverDocuments();
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    type: DriverDocument['type'] | null;
    label: string;
  }>({ open: false, type: null, label: '' });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: 'Validé', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      pending: { label: 'En attente', variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      rejected: { label: 'Rejeté', variant: 'destructive' as const, className: '' },
      expired: { label: 'Expiré', variant: 'destructive' as const, className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }
    };

    const { label, variant, className } = config[status as keyof typeof config] || 
      { label: 'Non fourni', variant: 'outline' as const, className: '' };

    return <Badge variant={variant} className={`text-xs ${className}`}>{label}</Badge>;
  };

  const openUploadModal = (doc: DriverDocument) => {
    setUploadModal({
      open: true,
      type: doc.type,
      label: doc.label
    });
  };

  const needsExpiry = (type: DriverDocument['type']) => {
    return ['license', 'insurance', 'technical_control'].includes(type);
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Documents</h3>
            </div>
            <Badge 
              variant={completionRate === 100 ? 'default' : 'secondary'} 
              className={completionRate === 100 ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
            >
              {completionRate}% complet
            </Badge>
          </div>
          
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.type}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.expires_at 
                        ? `Expire le ${new Date(doc.expires_at).toLocaleDateString('fr-FR')}`
                        : doc.status === 'approved' ? 'Vérifié' : 
                          doc.status === 'pending' && doc.uploaded_at ? 'En cours de vérification' : 'À fournir'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  
                  {doc.url && doc.status === 'approved' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => openUploadModal(doc)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {doc.status === 'pending' && doc.uploaded_at ? 'Modifier' : 'Ajouter'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Modal d'upload */}
      {uploadModal.type && (
        <DocumentUploadModal
          open={uploadModal.open}
          onOpenChange={(open) => setUploadModal(prev => ({ ...prev, open }))}
          documentType={uploadModal.type}
          documentLabel={uploadModal.label}
          requiresExpiry={needsExpiry(uploadModal.type)}
        />
      )}
    </>
  );
};
