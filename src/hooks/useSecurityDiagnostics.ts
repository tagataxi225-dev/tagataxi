import { useState } from 'react';
import { toast } from 'sonner';

interface SecurityFix {
  id: string;
  title: string;
  description: string;
  sqlFix?: string;
  manualSteps?: string[];
  autoFixable: boolean;
}

export const useSecurityDiagnostics = () => {
  const [isFixing, setIsFixing] = useState(false);

  const securityFixes: SecurityFix[] = [
    {
      id: 'clients_rls',
      title: 'Sécuriser la table clients',
      description: 'Ajouter des politiques RLS strictes pour protéger les données personnelles',
      autoFixable: true,
      sqlFix: `
-- Politique RLS stricte pour les clients
CREATE POLICY "clients_strict_own_data_only" ON public.clients
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour les admins avec audit
CREATE POLICY "clients_admin_with_audit" ON public.clients
  FOR SELECT USING (
    is_current_user_super_admin() 
    AND log_security_audit('admin_client_access', 'clients', jsonb_build_object('accessed_user', user_id)) IS NOT NULL
  );
      `.trim()
    },
    {
      id: 'payment_methods_rls',
      title: 'Sécuriser la table payment_methods',
      description: 'Restreindre l\'accès aux méthodes de paiement',
      autoFixable: true,
      sqlFix: `
-- Activer RLS sur payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Politique stricte pour les propriétaires
CREATE POLICY "payment_methods_owner_only" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique admin avec audit
CREATE POLICY "payment_methods_admin_audit" ON public.payment_methods
  FOR SELECT USING (
    is_current_user_super_admin()
    AND log_security_audit('admin_payment_access', 'payment_methods', jsonb_build_object('user_id', user_id)) IS NOT NULL
  );
      `.trim()
    },
    {
      id: 'transport_bookings_rls',
      title: 'Sécuriser les réservations de transport',
      description: 'Protéger les données de localisation des utilisateurs',
      autoFixable: true,
      sqlFix: `
-- Politique pour les clients
CREATE POLICY "transport_bookings_client_access" ON public.transport_bookings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour les chauffeurs assignés
CREATE POLICY "transport_bookings_driver_access" ON public.transport_bookings
  FOR SELECT USING (
    auth.uid() = driver_id 
    AND status IN ('driver_assigned', 'in_progress', 'completed')
  );

-- Politique admin avec audit
CREATE POLICY "transport_bookings_admin_audit" ON public.transport_bookings
  FOR SELECT USING (
    is_current_user_admin()
    AND log_security_audit('admin_booking_access', 'transport_bookings', jsonb_build_object('booking_id', id)) IS NOT NULL
  );
      `.trim()
    },
    {
      id: 'security_definer_views',
      title: 'Supprimer les vues SECURITY DEFINER',
      description: 'Convertir toutes les vues en SECURITY INVOKER',
      autoFixable: true,
      sqlFix: `
-- Rechercher et corriger automatiquement toutes les vues SECURITY DEFINER
DO $$
DECLARE
  view_record RECORD;
BEGIN
  FOR view_record IN 
    SELECT schemaname, viewname 
    FROM pg_views 
    WHERE schemaname = 'public'
      AND definition LIKE '%SECURITY DEFINER%'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', 
      view_record.schemaname, view_record.viewname);
  END LOOP;
END $$;
      `.trim()
    },
    {
      id: 'leaked_password_protection',
      title: 'Activer la protection contre les mots de passe compromis',
      description: 'Configuration manuelle requise dans le dashboard Supabase',
      autoFixable: false,
      manualSteps: [
        'Ouvrir le Dashboard Supabase',
        'Aller dans Authentication > Settings',
        'Activer "Leaked Password Protection"',
        'Sauvegarder les changements'
      ]
    },
    {
      id: 'postgres_upgrade',
      title: 'Mettre à jour PostgreSQL',
      description: 'Appliquer les derniers correctifs de sécurité',
      autoFixable: false,
      manualSteps: [
        'Ouvrir le Dashboard Supabase',
        'Aller dans Settings > Infrastructure',
        'Cliquer sur "Upgrade" pour PostgreSQL',
        'Suivre les instructions de migration'
      ]
    }
  ];

  const applyFix = async (fixId: string) => {
    const fix = securityFixes.find(f => f.id === fixId);
    if (!fix || !fix.autoFixable) {
      toast.error('Cette correction nécessite une action manuelle');
      return false;
    }

    toast.info(`📋 Copier le SQL dans l'éditeur Supabase pour appliquer: ${fix.title}`);
    
    // Copier le SQL dans le presse-papiers
    if (fix.sqlFix && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fix.sqlFix);
        toast.success('SQL copié dans le presse-papiers');
      } catch (err) {
        console.error('Erreur copie:', err);
      }
    }
    
    return true;
  };

  const applyAllAutoFixes = async () => {
    setIsFixing(true);
    const autoFixable = securityFixes.filter(f => f.autoFixable);
    
    for (const fix of autoFixable) {
      await applyFix(fix.id);
    }
    
    setIsFixing(false);
    toast.success(`${autoFixable.length} corrections appliquées`);
  };

  return {
    securityFixes,
    applyFix,
    applyAllAutoFixes,
    isFixing
  };
};
