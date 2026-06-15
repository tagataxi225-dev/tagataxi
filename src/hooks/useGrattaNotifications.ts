import { useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

// Messages en Lingala avec traduction française
const LINGALA_MESSAGES = {
  daily_card_ready: {
    title: '🎰 Carte na yo ezali prêt!',
    body: 'Yaka gratter carte na yo ya mokolo! 🇨🇩',
    titleFr: 'Ta carte est prête !',
    bodyFr: 'Viens gratter ta carte du jour !'
  },
  card_expiring: {
    title: '⏰ Keba! Carte ekozala expired!',
    body: 'Gratta vite avant 24h! 🎁',
    titleFr: 'Attention ! Carte bientôt expirée !',
    bodyFr: 'Gratte vite avant 24h !'
  },
  mega_card_weekend: {
    title: '🟡 MÉGA CARTE ya Weekend!',
    body: 'Carte Or ezali kozela yo! Nzela monene! ✨',
    titleFr: 'MÉGA CARTE du Week-end !',
    bodyFr: 'La carte Or t\'attend ! Grande chance !'
  },
  badge_earned: {
    title: '🏆 Badge sika! Ozui badge!',
    body: 'Félicitations na yo! Tala badge na yo! 🎉',
    titleFr: 'Nouveau badge gagné !',
    bodyFr: 'Félicitations ! Découvre ton nouveau badge !'
  },
  streak_reminder: {
    title: '🔥 Kobosana te! N\'oublie pas!',
    body: 'Gratta carte na yo po na streak! 📅',
    titleFr: 'N\'oublie pas ton streak !',
    bodyFr: 'Gratte ta carte pour maintenir ta série !'
  },
  vip_reward: {
    title: '⭐ VIP Bonus! Ozali champion!',
    body: 'Carte rare ezali kozela yo! 💎',
    titleFr: 'Bonus VIP !',
    bodyFr: 'Une carte rare t\'attend !'
  }
};

type NotificationType = keyof typeof LINGALA_MESSAGES;

export const useGrattaNotifications = () => {
  const isNative = Capacitor.isNativePlatform();

  // Initialiser les notifications
  useEffect(() => {
    if (!isNative) return;

    const initNotifications = async () => {
      try {
        // Demander la permission pour les notifications locales
        const localPermission = await LocalNotifications.requestPermissions();
        console.log('📱 Local notifications permission:', localPermission.display);

        // Demander la permission pour les push notifications
        const pushPermission = await PushNotifications.requestPermissions();
        console.log('📱 Push notifications permission:', pushPermission.receive);

        if (pushPermission.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (error) {
        console.log('Notifications not available:', error);
      }
    };

    initNotifications();
  }, [isNative]);

  // Envoyer une notification locale
  const sendLocalNotification = useCallback(async (
    type: NotificationType,
    options?: {
      useLingala?: boolean;
      customTitle?: string;
      customBody?: string;
      delayMinutes?: number;
      badgeName?: string;
    }
  ) => {
    if (!isNative) {
      // Fallback web: utiliser l'API Notification si disponible
      if ('Notification' in window && Notification.permission === 'granted') {
        const msg = LINGALA_MESSAGES[type];
        const title = options?.customTitle || (options?.useLingala !== false ? msg.title : msg.titleFr);
        let body = options?.customBody || (options?.useLingala !== false ? msg.body : msg.bodyFr);
        
        if (options?.badgeName) {
          body = body.replace('{badge}', options.badgeName);
        }

        new Notification(title, { body, icon: '/favicon.ico' });
      }
      return;
    }

    try {
      const msg = LINGALA_MESSAGES[type];
      const title = options?.customTitle || (options?.useLingala !== false ? msg.title : msg.titleFr);
      let body = options?.customBody || (options?.useLingala !== false ? msg.body : msg.bodyFr);
      
      if (options?.badgeName) {
        body = body.replace('{badge}', options.badgeName);
      }

      const scheduleAt = options?.delayMinutes 
        ? new Date(Date.now() + options.delayMinutes * 60 * 1000)
        : undefined;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            schedule: scheduleAt ? { at: scheduleAt } : undefined,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            largeIcon: 'ic_launcher',
            channelId: 'kwenda-gratta'
          }
        ]
      });

      console.log(`📱 Notification scheduled: ${type}`);
    } catch (error) {
      console.log('Failed to send notification:', error);
    }
  }, [isNative]);

  // Programmer la notification de carte quotidienne
  const scheduleDailyCardReminder = useCallback(async (nextCardTime: Date) => {
    if (!isNative) return;

    try {
      // Annuler les anciennes notifications de rappel
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });

      // Programmer une nouvelle notification
      const now = new Date();
      const delayMs = nextCardTime.getTime() - now.getTime();
      
      if (delayMs > 0) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: LINGALA_MESSAGES.daily_card_ready.title,
              body: LINGALA_MESSAGES.daily_card_ready.body,
              schedule: { at: nextCardTime },
              sound: 'default',
              channelId: 'kwenda-gratta'
            }
          ]
        });
        console.log('📱 Daily card reminder scheduled for:', nextCardTime);
      }
    } catch (error) {
      console.log('Failed to schedule reminder:', error);
    }
  }, [isNative]);

  // Programmer un rappel de streak
  const scheduleStreakReminder = useCallback(async () => {
    if (!isNative) return;

    try {
      // Rappel à 20h si pas encore gratté aujourd'hui
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(20, 0, 0, 0);

      if (reminderTime <= now) {
        // Si 20h est passé, programmer pour demain
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1002,
            title: LINGALA_MESSAGES.streak_reminder.title,
            body: LINGALA_MESSAGES.streak_reminder.body,
            schedule: { at: reminderTime },
            sound: 'default',
            channelId: 'kwenda-gratta'
          }
        ]
      });
      console.log('📱 Streak reminder scheduled');
    } catch (error) {
      console.log('Failed to schedule streak reminder:', error);
    }
  }, [isNative]);

  // Notification de badge gagné
  const notifyBadgeEarned = useCallback(async (badgeName: string) => {
    await sendLocalNotification('badge_earned', { 
      badgeName,
      customBody: `Félicitations! Tu as gagné le badge "${badgeName}" ! 🏆`
    });
  }, [sendLocalNotification]);

  // Notification de Méga Carte weekend
  const notifyMegaCardWeekend = useCallback(async () => {
    const today = new Date().getDay();
    if (today === 6 || today === 0) { // Samedi ou Dimanche
      await sendLocalNotification('mega_card_weekend');
    }
  }, [sendLocalNotification]);

  return {
    sendLocalNotification,
    scheduleDailyCardReminder,
    scheduleStreakReminder,
    notifyBadgeEarned,
    notifyMegaCardWeekend
  };
};
