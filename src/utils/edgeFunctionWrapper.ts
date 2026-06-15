import { supabase } from '@/integrations/supabase/client';

interface InvokeOptions {
  functionName: string;
  body: any;
  retryOn401?: boolean;
}

export const invokeEdgeFunction = async ({
  functionName,
  body,
  retryOn401 = true
}: InvokeOptions) => {
  console.log(`🚀 [invokeEdgeFunction] Appel à ${functionName}`);
  
  // ✅ CRITIQUE : Rafraîchir la session AVANT l'appel pour garantir un token valide
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ Aucune session active');
    throw new Error('Session invalide - veuillez vous reconnecter');
  }
  
  // Vérifier si le token expire dans moins de 5 minutes
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  
  if (timeUntilExpiry < 5 * 60 * 1000) {
    console.log('🔄 Token expire bientôt, rafraîchissement préventif...');
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !newSession) {
      console.error('❌ Échec refresh préventif:', refreshError);
      throw new Error('Impossible de rafraîchir la session');
    }
    
    console.log('✅ Session rafraîchie avec succès');
    // ⏳ Attendre que le client Supabase synchronise le nouveau token
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  let attempt = 0;
  const maxAttempts = retryOn401 ? 2 : 1;
  
  while (attempt < maxAttempts) {
    // ✅ Le client Supabase utilise automatiquement la session fraîche
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });
    
    // Si erreur 401 et retry activé
    if (error?.message?.includes('401') && attempt === 0 && retryOn401) {
      console.warn('🔄 Erreur 401, retry après refresh session...');
      const { data: { session: retrySession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (retrySession && !refreshError) {
        console.log('✅ Session rafraîchie pour retry');
        // ⏳ Attendre que le client Supabase synchronise le nouveau token
        await new Promise(resolve => setTimeout(resolve, 100));
        attempt++;
        continue;
      } else {
        console.error('❌ Échec refresh pour retry:', refreshError);
        return { data, error };
      }
    }
    
    return { data, error };
  }
  
  throw new Error('Échec après retry');
};
