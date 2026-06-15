import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PushNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image_url?: string;
  click_action?: string;
  priority?: 'normal' | 'high';
  ttl?: number; // Time to live in seconds
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  condition?: string;
  notification: {
    title: string;
    body: string;
    image?: string;
    click_action?: string;
    sound?: string;
  };
  data?: Record<string, string>;
  priority?: string;
  time_to_live?: number;
  content_available?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");
    if (!firebaseServerKey) {
      console.error("❌ FIREBASE_SERVER_KEY not configured");
      throw new Error("Firebase server key not configured");
    }

    const requestData: PushNotificationRequest = await req.json();
    const { 
      user_id, 
      user_ids, 
      topic,
      title, 
      body, 
      data = {}, 
      image_url,
      click_action,
      priority = 'high',
      ttl = 86400 // 24 heures par défaut
    } = requestData;

    if (!title || !body) {
      throw new Error("Title and body are required");
    }

    if (!user_id && !user_ids?.length && !topic) {
      throw new Error("Either user_id, user_ids, or topic is required");
    }

    console.log(`📱 Sending push notification: "${title}"`);

    // Récupérer les tokens des utilisateurs
    let tokens: string[] = [];
    let targetUserIds: string[] = [];

    if (user_id) {
      targetUserIds = [user_id];
    } else if (user_ids?.length) {
      targetUserIds = user_ids;
    }

    if (targetUserIds.length > 0) {
      const { data: tokenRecords, error: tokenError } = await supabaseClient
        .from('push_notification_tokens')
        .select('token, platform, user_id')
        .in('user_id', targetUserIds)
        .eq('is_active', true);

      if (tokenError) {
        console.error('❌ Error fetching tokens:', tokenError);
        throw new Error('Failed to fetch push tokens');
      }

      if (!tokenRecords || tokenRecords.length === 0) {
        console.log('⚠️ No active push tokens found for users:', targetUserIds);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No active push tokens found',
            sent_count: 0
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      tokens = tokenRecords.map(r => r.token);
      console.log(`📱 Found ${tokens.length} tokens for ${targetUserIds.length} users`);
    }

    // Construire le message FCM
    const fcmMessage: FCMMessage = {
      notification: {
        title,
        body,
        sound: 'default',
      },
      data: {
        ...data,
        click_action: click_action || 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString(),
      },
      priority: priority === 'high' ? 'high' : 'normal',
      time_to_live: ttl,
      content_available: true,
    };

    if (image_url) {
      fcmMessage.notification.image = image_url;
    }

    if (click_action) {
      fcmMessage.notification.click_action = click_action;
    }

    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    // Envoyer via topic
    if (topic) {
      console.log(`📡 Sending to topic: ${topic}`);
      
      const topicMessage = {
        ...fcmMessage,
        to: `/topics/${topic}`,
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${firebaseServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicMessage),
      });

      const result = await response.json();
      console.log('📡 Topic send result:', result);

      if (result.message_id) {
        successCount = 1;
      } else {
        failureCount = 1;
      }
    }

    // Envoyer aux tokens individuels (par lots de 1000 max)
    if (tokens.length > 0) {
      const batchSize = 1000;
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batchTokens = tokens.slice(i, i + batchSize);
        
        const batchMessage = {
          ...fcmMessage,
          registration_ids: batchTokens,
        };

        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${firebaseServerKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batchMessage),
          });

          const result = await response.json();
          console.log(`📱 Batch ${Math.floor(i / batchSize) + 1} result:`, {
            success: result.success,
            failure: result.failure,
            canonical_ids: result.canonical_ids,
          });

          successCount += result.success || 0;
          failureCount += result.failure || 0;

          // Gérer les tokens invalides
          if (result.results) {
            result.results.forEach((res: any, index: number) => {
              if (res.error === 'InvalidRegistration' || res.error === 'NotRegistered') {
                failedTokens.push(batchTokens[index]);
              }
            });
          }
        } catch (fetchError) {
          console.error(`❌ Error sending batch:`, fetchError);
          failureCount += batchTokens.length;
        }
      }

      // Désactiver les tokens invalides
      if (failedTokens.length > 0) {
        console.log(`🗑️ Deactivating ${failedTokens.length} invalid tokens`);
        
        const { error: updateError } = await supabaseClient
          .from('push_notification_tokens')
          .update({ is_active: false })
          .in('token', failedTokens);

        if (updateError) {
          console.error('⚠️ Error deactivating tokens:', updateError);
        }
      }
    }

    // Logger la notification envoyée
    const logData = {
      user_id: user_id || targetUserIds[0] || null,
      title,
      message: body,
      notification_type: data.type || 'general',
      priority,
      data: {
        ...data,
        topic,
        success_count: successCount,
        failure_count: failureCount,
      },
      is_sent: successCount > 0,
      sent_at: new Date().toISOString(),
    };

    // Insérer dans push_notifications si la table existe
    try {
      await supabaseClient
        .from('push_notifications')
        .insert(logData);
    } catch (insertError) {
      console.log('⚠️ Could not log notification (table may not exist)');
    }

    // Logger dans activity_logs
    if (targetUserIds.length > 0) {
      for (const uid of targetUserIds) {
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: uid,
            activity_type: 'push_notification_sent',
            description: `Push notification: ${title}`,
            metadata: {
              title,
              body,
              success: successCount > 0,
              data,
            },
          });
      }
    }

    console.log(`✅ Push notification complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: successCount,
        failed_count: failureCount,
        deactivated_tokens: failedTokens.length,
        message: `Notification envoyée à ${successCount} appareil(s)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('❌ Push notification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Échec de l\'envoi de la notification push',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
