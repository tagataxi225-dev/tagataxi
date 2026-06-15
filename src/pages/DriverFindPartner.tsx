import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Copy, CheckCircle, Clock, XCircle, Car } from 'lucide-react';

interface DriverProfile {
  role: string; // 'chauffeur' ou 'livreur'
  service_type: string | null; // 'transport' ou 'delivery'
  has_own_vehicle: boolean;
  verification_status: string;
  is_active: boolean;
}

interface PartnerRequest {
  id: string;
  partner_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  response_message: string | null;
  partenaires: {
    company_name: string;
    display_name: string;
    business_type: string;
  };
}

export const DriverFindPartner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [driverCode, setDriverCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/driver/auth', { replace: true });
      return;
    }

    loadDriverProfile();
    loadPartnerRequests();
    loadDriverCode();
  }, [user, navigate]);

  // ── Inchangé : profil chauffeur + redirection si déjà partenaire actif ──
  const loadDriverProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('role, service_type, has_own_vehicle, verification_status, is_active')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setDriverProfile(data);

      // Ne rediriger que si le chauffeur a déjà un partenaire actif
      const { data: existingPartner } = await supabase
        .from('partner_drivers')
        .select('id')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingPartner) {
        navigate('/app/chauffeur');
        return;
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
      toast.error('Erreur lors du chargement du profil');
      navigate('/driver/auth', { replace: true });
    }
  };

  // ── Inchangé : liste des demandes envoyées ──
  const loadPartnerRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_driver_requests')
        .select(`
          id,
          partner_id,
          status,
          created_at,
          responded_at,
          response_message,
          partenaires (
            company_name,
            display_name,
            business_type
          )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error loading partner requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  // ── Nouveau : code chauffeur actif ──
  const loadDriverCode = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('driver_codes')
      .select('code')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (data?.code) setDriverCode(data.code);
  };

  const copyDriverCode = async () => {
    if (!driverCode) return;
    try {
      await navigator.clipboard.writeText(driverCode);
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
          <Clock className="w-3 h-3" /> En attente
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" /> Acceptée
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
          <XCircle className="w-3 h-3" /> Refusée
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-xl font-bold">Profil introuvable</h2>
        <p className="text-sm text-muted-foreground">
          Nous n'avons pas trouvé votre profil chauffeur.
        </p>
        <button
          type="button"
          onClick={() => navigate('/driver/auth', { replace: true })}
          className="h-11 px-4 rounded-2xl bg-red-600 text-white font-semibold"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base">Trouver un partenaire</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Bannière demande approuvée */}
        {requests.some((r) => r.status === 'approved') && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-green-800 dark:text-green-200">Demande approuvée !</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Votre partenaire va vous assigner un véhicule. Vous recevrez une notification dès que c'est fait.
              </p>
            </div>
          </div>
        )}

        {/* Code chauffeur */}
        {driverCode && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-2xl p-4">
            <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
              Votre code chauffeur
            </p>
            <div className="flex items-center justify-between gap-3 mt-1">
              <p className="text-2xl font-black tracking-wider text-red-900 dark:text-red-100 tabular-nums">
                {driverCode}
              </p>
              <button
                type="button"
                onClick={copyDriverCode}
                aria-label="Copier le code chauffeur"
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white dark:bg-background border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-semibold active:scale-95 transition-transform"
                style={{ touchAction: 'manipulation' }}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-2">
              Communiquez ce code au partenaire pour qu'il vous ajoute à sa flotte.
            </p>
          </div>
        )}

        {/* Bannière véhicule en attente */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 dark:text-amber-200">Véhicule en attente</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Votre partenaire vous assignera un véhicule après acceptation de votre demande.
            </p>
          </div>
        </div>

        {/* Mes demandes */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Mes demandes</h2>
          {requests.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Aucune demande envoyée pour l'instant.
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {r.partenaires?.company_name || 'Partenaire'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
                {r.response_message && (
                  <p className="text-xs text-muted-foreground mt-2 pl-13">
                    {r.response_message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverFindPartner;
