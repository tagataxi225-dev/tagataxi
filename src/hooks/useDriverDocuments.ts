/**
 * 📄 Hook gestion documents chauffeur
 * - Upload vers Supabase Storage
 * - Gestion statuts (pending, approved, rejected, expired)
 * - Notifications d'expiration
 * - Historique de validation
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface DriverDocument {
  type: 'license' | 'insurance' | 'registration' | 'technical_control' | 'transport_authorization';
  label: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploaded_at?: string;
  expires_at?: string;
  rejection_reason?: string;
  required: boolean;
}

export const DOCUMENT_TYPES = {
  license: 'Permis de conduire',
  insurance: 'Assurance véhicule',
  registration: 'Carte grise',
  technical_control: 'Contrôle technique',
  transport_authorization: 'Autorisation transport marchandises'
};

export const useDriverDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Charger les documents du chauffeur
  const { data: documents, isLoading } = useQuery({
    queryKey: ['driver-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: chauffeur, error } = await supabase
        .from('chauffeurs')
        .select('documents, license_expiry, insurance_expiry, service_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const storedDocs = (chauffeur?.documents as Record<string, any>) || {};
      const serviceType = chauffeur?.service_type || 'taxi';

      // Documents requis selon le type de service
      const requiredDocs: DriverDocument[] = [
        {
          type: 'license',
          label: DOCUMENT_TYPES.license,
          required: true,
          expires_at: chauffeur?.license_expiry,
          status: 'pending',
          ...(storedDocs.license || {})
        },
        {
          type: 'insurance',
          label: DOCUMENT_TYPES.insurance,
          required: true,
          expires_at: chauffeur?.insurance_expiry,
          status: 'pending',
          ...(storedDocs.insurance || {})
        },
        {
          type: 'registration',
          label: DOCUMENT_TYPES.registration,
          required: true,
          status: 'pending',
          ...(storedDocs.registration || {})
        },
        {
          type: 'technical_control',
          label: DOCUMENT_TYPES.technical_control,
          required: true,
          status: 'pending',
          ...(storedDocs.technical_control || {})
        }
      ];

      // Ajouter autorisation transport pour livreurs
      if (serviceType === 'delivery') {
        requiredDocs.push({
          type: 'transport_authorization',
          label: DOCUMENT_TYPES.transport_authorization,
          required: true,
          status: 'pending',
          ...(storedDocs.transport_authorization || {})
        });
      }

      // Vérifier les expirations
      return requiredDocs.map(doc => {
        if (doc.expires_at) {
          const expiryDate = new Date(doc.expires_at);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            return { ...doc, status: 'expired' as const };
          } else if (daysUntilExpiry < 30 && doc.status === 'approved') {
            // Alerter si expiration dans moins de 30 jours
            return { ...doc, status: 'approved' as const, warning: true };
          }
        }
        return doc;
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // ✅ 5 minutes - données utilisateur
    gcTime: 15 * 60 * 1000 // ✅ 15 minutes
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      documentType,
      expiresAt 
    }: { 
      file: File; 
      documentType: DriverDocument['type'];
      expiresAt?: string;
    }) => {
      if (!user) throw new Error('Non authentifié');

      // 1. Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      // 3. Mettre à jour dans chauffeurs.documents
      const { data: currentData } = await supabase
        .from('chauffeurs')
        .select('documents')
        .eq('user_id', user.id)
        .single();

      const currentDocs = (currentData?.documents as Record<string, any>) || {};
      
      const updatedDocuments = {
        ...currentDocs,
        [documentType]: {
          url: publicUrl,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
          expires_at: expiresAt || null
        }
      };

      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({ 
          documents: updatedDocuments,
          ...(documentType === 'license' && expiresAt && { license_expiry: expiresAt }),
          ...(documentType === 'insurance' && expiresAt && { insurance_expiry: expiresAt })
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { url: publicUrl, documentType };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast.success('Document uploadé avec succès', {
        description: 'Il sera vérifié par notre équipe sous 24h'
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload du document');
    }
  });

  // Supprimer un document
  const deleteDocument = useMutation({
    mutationFn: async (documentType: DriverDocument['type']) => {
      if (!user) throw new Error('Non authentifié');

      const { data: currentData } = await supabase
        .from('chauffeurs')
        .select('documents')
        .eq('user_id', user.id)
        .single();

      const currentDocs = (currentData?.documents as Record<string, any>) || {};
      const updatedDocuments = { ...currentDocs };
      delete updatedDocuments[documentType];

      const { error } = await supabase
        .from('chauffeurs')
        .update({ documents: updatedDocuments })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast.success('Document supprimé');
    }
  });

  const completedDocs = documents?.filter(d => d.status === 'approved').length || 0;
  const totalDocs = documents?.length || 0;
  const completionRate = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  return {
    documents: documents || [],
    loading: isLoading,
    uploadDocument,
    deleteDocument,
    completionRate,
    needsAttention: documents?.filter(d => d.status === 'expired' || d.status === 'rejected').length || 0
  };
};
