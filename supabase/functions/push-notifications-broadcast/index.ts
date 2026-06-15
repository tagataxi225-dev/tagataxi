import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// === FCM: génère un access token OAuth via le service account (signé JWT RS256) ===
async function getFCMAccessToken(): Promise<string | null> {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountJson) {
    console.log("FIREBASE_SERVICE_ACCOUNT not configured");
    return null;
  }
  try {
    const sa = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const b64url = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const unsigned =
      b64url({ alg: "RS256", typ: "JWT" }) + "." +
      b64url({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      });
    const pem = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "");
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "pkcs8",
      der.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(unsigned)
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwt = unsigned + "." + sigB64;
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
    });
    if (!resp.ok) {
      console.error("OAuth token error:", await resp.text());
      return null;
    }
    const json = await resp.json();
    return json.access_token ?? null;
  } catch (error) {
    console.error("Error generating FCM access token:", error);
    return null;
  }
}

// === FCM: envoie une push à un token unique (access token déjà obtenu) ===
async function sendFCMToToken(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  type: string,
  priority: string,
  imageUrl?: string,
  extraData?: Record<string, unknown>
): Promise<boolean> {
  const fcmMessage = {
    message: {
      token,
      notification: {
        title,
        body,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
      data: {
        category: type,
        priority,
        ...Object.fromEntries(
          Object.entries(extraData || {}).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: priority === 'urgent' || priority === 'high' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          channel_id: `kwenda_${type}`,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            'mutable-content': 1,
          },
        },
      },
    },
  };
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmMessage),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      console.error('FCM send error:', err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('FCM request failed:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header is required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authorization token");

    const { data: adminCheck } = await supabaseClient
      .from('admins')
      .select('id, admin_level')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) throw new Error("Only admins can broadcast notifications");

    const body = await req.json();
    const {
      title, message, content, type = 'system', priority = 'normal',
      target_audience, target_type, target_city, target_user_ids, data,
      image_url
    } = body;

    const finalMessage = message || content || null;
    const audience = target_audience || target_type || null;

    if (!title || !finalMessage || !audience) {
      throw new Error(`Missing required fields: title=${!!title}, message=${!!finalMessage}, target_audience=${audience}`);
    }

    console.log(`Admin ${user.email} broadcasting ${priority} ${type} notification to ${audience}`);

    // Build user list
    let userIds: string[] = [];

    if (target_user_ids && target_user_ids.length > 0) {
      userIds = target_user_ids;
    } else {
      switch (audience) {
        case 'clients': {
          let query = supabaseClient.from('clients').select('user_id').eq('is_active', true);
          if (target_city) query = query.eq('city', target_city);
          const { data: clients } = await query;
          userIds = clients?.map(c => c.user_id) || [];
          break;
        }
        case 'drivers': {
          const { data: drivers } = await supabaseClient.from('chauffeurs').select('user_id').eq('is_active', true);
          userIds = drivers?.map(d => d.user_id) || [];
          break;
        }
        case 'partners': {
          const { data: partners } = await supabaseClient.from('partenaires').select('user_id').eq('is_active', true);
          userIds = partners?.map(p => p.user_id) || [];
          break;
        }
        case 'vendors': {
          let query = supabaseClient.from('vendor_profiles').select('user_id').eq('is_active', true);
          if (target_city) query = query.eq('city', target_city);
          const { data: vendors } = await query;
          userIds = vendors?.map(v => v.user_id) || [];
          break;
        }
        case 'admins': {
          const { data: admins } = await supabaseClient.from('admins').select('user_id').eq('is_active', true);
          userIds = admins?.map(a => a.user_id) || [];
          break;
        }
        case 'all': {
          const [c, d, p, v] = await Promise.all([
            supabaseClient.from('clients').select('user_id').eq('is_active', true),
            supabaseClient.from('chauffeurs').select('user_id').eq('is_active', true),
            supabaseClient.from('partenaires').select('user_id').eq('is_active', true),
            supabaseClient.from('vendor_profiles').select('user_id').eq('is_active', true),
          ]);
          const allIds = new Set([
            ...(c.data?.map(x => x.user_id) || []),
            ...(d.data?.map(x => x.user_id) || []),
            ...(p.data?.map(x => x.user_id) || []),
            ...(v.data?.map(x => x.user_id) || []),
          ]);
          userIds = Array.from(allIds);
          break;
        }
      }
    }

    console.log(`Found ${userIds.length} target users for broadcast`);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users found for target audience", stats: { total: 0, sent: 0, failed: 0, fcm_sent: 0 } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create broadcast record
    const { data: broadcast } = await supabaseClient
      .from('admin_notifications')
      .insert({
        title, message: finalMessage, type: 'broadcast',
        severity: priority === 'urgent' ? 'critical' : priority === 'high' ? 'warning' : 'info',
        data: { broadcast_type: type, target_audience: audience, target_city, user_count: userIds.length, sent_by: user.id },
        is_read: false
      })
      .select()
      .single();

    // Batch insert push_notifications + user_notification_logs (historique / in-app)
    const BATCH_SIZE = 200;
    let dbInserted = 0;
    let dbFailed = 0;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      const notifications = batch.map(userId => ({
        user_id: userId, title, message: finalMessage,
        notification_type: type, priority, data: data || {}, is_sent: true, sent_at: new Date().toISOString()
      }));

      const logEntries = batch.map(userId => ({
        user_id: userId, title, message: finalMessage,
        category: type, priority, is_read: false, is_archived: false,
        metadata: { broadcast_id: broadcast?.id, image_url, ...(data || {}) }
      }));

      const [{ error: insertError }, { error: logError }] = await Promise.all([
        supabaseClient.from('push_notifications').insert(notifications),
        supabaseClient.from('user_notification_logs').insert(logEntries)
      ]);

      if (insertError) {
        console.error(`Batch insert error:`, insertError);
        dbFailed += batch.length;
      } else {
        dbInserted += batch.length;
      }
      if (logError) console.error(`Log insert error:`, logError);
    }

    // === ENVOI FCM RÉEL (push app fermée) ===
    // 1) Récupérer tous les tokens FCM actifs des users ciblés
    let fcmSent = 0;
    let fcmFailed = 0;
    const accessToken = await getFCMAccessToken();
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");

    if (!accessToken || !projectId) {
      console.error("FCM access token or project id missing — push FCM skipped, Realtime only");
    } else {
      // Récupère les tokens par lots (pour éviter une requête .in() trop grosse)
      const TOKEN_FETCH_BATCH = 300;
      const tokens: string[] = [];
      for (let i = 0; i < userIds.length; i += TOKEN_FETCH_BATCH) {
        const slice = userIds.slice(i, i + TOKEN_FETCH_BATCH);
        const { data: tokenRows } = await supabaseClient
          .from('push_notification_tokens')
          .select('token')
          .in('user_id', slice)
          .eq('is_active', true);
        if (tokenRows) tokens.push(...tokenRows.map((t: { token: string }) => t.token));
      }

      console.log(`Found ${tokens.length} active FCM tokens to push`);

      // 2) Envoi FCM en parallèle, par chunks de 50
      const FCM_CONCURRENCY = 50;
      for (let i = 0; i < tokens.length; i += FCM_CONCURRENCY) {
        const chunk = tokens.slice(i, i + FCM_CONCURRENCY);
        const results = await Promise.allSettled(
          chunk.map((tk) =>
            sendFCMToToken(accessToken, projectId, tk, title, finalMessage, type, priority, image_url, data)
          )
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) fcmSent++;
          else fcmFailed++;
        }
      }
      console.log(`FCM push: ${fcmSent} sent, ${fcmFailed} failed`);
    }

    // === Realtime (in-app, best-effort, pour users app ouverte) ===
    const notifPayload = {
      id: broadcast?.id || crypto.randomUUID(),
      title, message: finalMessage, type, priority,
      image_url, data: data || {}, timestamp: new Date().toISOString()
    };

    const CONCURRENCY = 20;
    for (let i = 0; i < userIds.length; i += CONCURRENCY) {
      const chunk = userIds.slice(i, i + CONCURRENCY);
      await Promise.allSettled(chunk.map(async (userId) => {
        try {
          const channel = supabaseClient.channel(`notifications:${userId}`);
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
            channel.subscribe((status: string) => {
              if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
              else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                clearTimeout(timeout); reject(new Error(status));
              }
            });
          });
          await channel.send({ type: 'broadcast', event: 'new_notification', payload: notifPayload });
          await supabaseClient.removeChannel(channel);
        } catch (_e) {
          // best-effort
        }
      }));
    }

    const duration = Date.now() - startTime;

    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'broadcast_notification',
      description: `Broadcast "${title}" to ${audience} (FCM: ${fcmSent} sent, ${fcmFailed} failed)`,
      metadata: { broadcast_id: broadcast?.id, target_audience: audience, target_city, total_users: userIds.length, db_inserted: dbInserted, db_failed: dbFailed, fcm_sent: fcmSent, fcm_failed: fcmFailed, duration_ms: duration }
    });

    console.log(`Broadcast complete: FCM ${fcmSent} sent in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast envoyé : ${fcmSent} notifications push (FCM) sur ${userIds.length} utilisateurs`,
        stats: {
          total_users: userIds.length,
          db_inserted: dbInserted,
          db_failed: dbFailed,
          fcm_sent: fcmSent,
          fcm_failed: fcmFailed,
          duration_ms: duration
        },
        broadcast_id: broadcast?.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error', message: "Échec de l'envoi du broadcast" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
