import { FileText, CheckCircle, Clock, XCircle, AlertCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Document {
  name: string;
  status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
  uploadDate?: string;
  expiryDate?: string;
}

export function RestaurantDocuments() {
  const documents: Document[] = [
    {
      name: 'Licence d\'exploitation',
      status: 'verified',
      uploadDate: '2024-01-15',
      expiryDate: '2025-01-15',
    },
    {
      name: 'Certificat d\'hygiène',
      status: 'verified',
      uploadDate: '2024-03-10',
      expiryDate: '2025-03-10',
    },
    {
      name: 'Assurance responsabilité civile',
      status: 'pending',
      uploadDate: '2024-12-01',
    },
    {
      name: 'Certificat de formation HACCP',
      status: 'missing',
    },
  ];

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
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
            <AlertCircle className="h-3 w-3 mr-1" />
            Manquant
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents légaux</h2>
        <p className="text-muted-foreground mt-1">
          Gérez vos certificats et licences
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{doc.name}</CardTitle>
                    {doc.uploadDate && (
                      <CardDescription>
                        Uploadé le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    )}
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {doc.expiryDate && (
                  <p className="text-sm text-muted-foreground">
                    Expire le {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {doc.status === 'missing' ? 'Uploader' : 'Modifier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
