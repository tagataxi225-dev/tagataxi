import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface DocumentPreviewProps {
  documentPath: string;
  userId: string;
  zoom?: number;
  rotation?: number;
}

export const DocumentPreview = ({ documentPath, userId, zoom = 1, rotation = 0 }: DocumentPreviewProps) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentUrl();
  }, [documentPath, userId]);

  const loadDocumentUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      // For private buckets, create a signed URL
      const { data, error: signedUrlError } = await supabase.storage
        .from('identity-documents')
        .createSignedUrl(documentPath, 3600); // Valid for 1 hour

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        throw signedUrlError;
      }

      if (data?.signedUrl) {
        setDocumentUrl(data.signedUrl);
      } else {
        throw new Error('No signed URL returned');
      }
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Impossible de charger le document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg bg-muted p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Chargement du document...</span>
      </div>
    );
  }

  if (error || !documentUrl) {
    return (
      <div className="border-2 border-red-200 rounded-lg bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">
          {error || 'Erreur de chargement'}
        </p>
      </div>
    );
  }

  // Check if it's a PDF
  const isPdf = documentPath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <div className="border rounded-lg overflow-hidden bg-muted">
        <iframe
          src={documentUrl}
          className="w-full h-[500px]"
          title="Document d'identité PDF"
        />
        <div className="p-2 bg-background border-t">
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Ouvrir le PDF dans un nouvel onglet
          </a>
        </div>
      </div>
    );
  }

  // For images
  return (
    <div className="border rounded-lg overflow-hidden bg-muted p-2">
      <img
        src={documentUrl}
        alt="Document d'identité"
        className="w-full h-auto transition-transform"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: 'center'
        }}
      />
    </div>
  );
};
