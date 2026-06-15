import React from 'react';
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
  uploadedAt?: string;
  expiryDate?: string;
}

export const PartnerDocuments: React.FC = () => {
  // Simuler des documents pour l'instant
  const documents: Document[] = [
    {
      id: '1',
      name: 'Licence d\'exploitation',
      type: 'business_license',
      status: 'verified',
      uploadedAt: '2024-01-15',
      expiryDate: '2025-01-15',
    },
    {
      id: '2',
      name: 'Certificat d\'assurance flotte',
      type: 'insurance',
      status: 'pending',
      uploadedAt: '2024-03-10',
    },
    {
      id: '3',
      name: 'Document fiscal',
      type: 'tax_document',
      status: 'verified',
      uploadedAt: '2024-02-20',
    },
    {
      id: '4',
      name: 'Contrat partenaire',
      type: 'contract',
      status: 'missing',
    },
  ];

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Vérifié
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
      case 'missing':
        return (
          <Badge variant="outline">
            <Upload className="h-3 w-3 mr-1" />
            À télécharger
          </Badge>
        );
    }
  };

  return (
    <Card className="card-floating border-0">
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents et Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-grey-50 rounded-xl hover:bg-grey-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-background rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-card-foreground">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(doc.status)}
                  {doc.uploadedAt && (
                    <span className="text-caption text-muted-foreground">
                      Téléchargé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                {doc.expiryDate && (
                  <p className="text-caption text-muted-foreground mt-1">
                    Expire le {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {doc.status === 'missing' ? (
                <Button size="sm" className="rounded-lg">
                  <Upload className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="rounded-lg">
                  Modifier
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
