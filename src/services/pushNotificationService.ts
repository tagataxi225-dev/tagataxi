// Service de gestion des notifications push navigateur
class PushNotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Afficher une notification push
  async showNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      image?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    }
  ): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(title, {
        icon: options?.icon || '/app-icon.png',
        body: options?.body,
        tag: options?.tag,
        requireInteraction: options?.requireInteraction || false,
      });

      // Gérer les clics sur la notification
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Si des données sont présentes, gérer la navigation
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };

      return;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Vérifier si les notifications sont supportées
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Obtenir le statut de la permission
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Mettre à jour le badge du navigateur (titre de la page)
  updatePageBadge(count: number): void {
    if (count > 0) {
      document.title = `(${count}) TAGA - Marketplace`;
    } else {
      document.title = 'TAGA - Marketplace';
    }
  }

  // Mettre à jour le favicon avec un badge
  updateFaviconBadge(count: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Dessiner le cercle de badge
    if (count > 0) {
      ctx.fillStyle = '#ef4444'; // Rouge
      ctx.beginPath();
      ctx.arc(24, 8, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Dessiner le nombre
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 9 ? '9+' : String(count), 24, 8);
    }

    // Mettre à jour le favicon
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL();
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

export const pushNotificationService = new PushNotificationService();
