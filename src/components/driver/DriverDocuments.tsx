import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  type: string;
  label: string;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  expiryDate?: string;
  uploadedAt?: string;
}

export const DriverDocuments: React.FC = () => {
  const { user } = useAuth();

  const { data: driverProfile } = useQuery({
    queryKey: ['driver-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('documents, license_expiry, insurance_expiry')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const documents: Document[] = [
    {
      id: 'license',
      type: 'license',
      label: 'Permis de conduire',
      status: driverProfile?.license_expiry ? 'verified' : 'pending',
      expiryDate: driverProfile?.license_expiry,
    },
    {
      id: 'insurance',
      type: 'insurance',
      label: 'Assurance véhicule',
      status: driverProfile?.insurance_expiry ? 'verified' : 'pending',
      expiryDate: driverProfile?.insurance_expiry,
    },
    {
      id: 'id_card',
      type: 'id_card',
      label: 'Carte d\'identité',
      status: 'pending',
    },
    {
      id: 'vehicle_registration',
      type: 'vehicle_registration',
      label: 'Carte grise',
      status: 'pending',
    },
  ];

  const handleUpload = (documentType: string) => {
    toast.info(`Upload de ${documentType} - Bientôt disponible`);
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const variants = {
      verified: { variant: 'default' as const, className: 'bg-green-500', label: 'Vérifié' },
      expired: { variant: 'destructive' as const, className: '', label: 'Expiré' },
      rejected: { variant: 'destructive' as const, className: 'bg-orange-500', label: 'Rejeté' },
      pending: { variant: 'secondary' as const, className: '', label: 'En attente' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Mes documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0">
              {getStatusIcon(doc.status)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium">{doc.label}</p>
              {doc.expiryDate && (
                <p className="text-xs text-muted-foreground">
                  Expire le {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(doc.status)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpload(doc.label)}
              >
                <Upload className="h-3 w-3 mr-1" />
                {doc.status === 'pending' ? 'Ajouter' : 'Modifier'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DriverDocuments;
