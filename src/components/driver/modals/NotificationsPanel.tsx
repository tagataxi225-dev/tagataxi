/**
 * NotificationsPanel — Notifications réelles depuis push_notifications
 * Design premium, sans données mockées, sans paramètres superflus
 */
import { useEffect, useState } from 'react';
import { Bell, Package, DollarSign, MessageSquare, Car, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';

function getIcon(type: string) {
  if (type?.includes('ride') || type?.includes('taxi')) return { Icon: Car,          bg: '#FFF3E0', color: '#FF9F0A' };
  if (type?.includes('payment') || type?.includes('wallet')) return { Icon: DollarSign,   bg: '#F0FDF4', color: '#30D158' };
  if (type?.includes('message') || type?.includes('chat'))   return { Icon: MessageSquare, bg: '#EFF6FF', color: '#0A84FF' };
  if (type?.includes('delivery'))                            return { Icon: Package,       bg: '#F5F3FF', color: '#BF5AF2' };
  return { Icon: Bell, bg: '#F2F2F7', color: '#8E8E93' };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Hier ${format(d, 'HH:mm')}`;
  return format(d, 'dd MMM, HH:mm', { locale: fr });
}

export const NotificationsPanel: React.FC = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('push_notifications')
        .select('id, notification_type, title, body, created_at, is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      setNotifs((data || []).map((n: any) => ({
        id: n.id,
        type: n.notification_type || '',
        title: n.title || 'Notification',
        message: n.body || '',
        created_at: n.created_at,
        is_read: n.is_read ?? true,
      })));
      setLoading(false);

      // Marquer tout comme lu
      await supabase.from('push_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    };
    load();
  }, [user?.id]);

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div style={{ fontFamily: F, padding: '4px 0' }}>

      {/* Header */}
      {unread > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF1F0', borderRadius: 20, padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8353B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E8353B' }}>{unread} non lue{unread > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCheck size={13} color="#8E8E93" />
            <span style={{ fontSize: 12, color: '#8E8E93' }}>Tout lire</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93', fontSize: 14 }}>
          Chargement...
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Bell size={24} color="#C7C7CC" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E', margin: '0 0 4px' }}>Aucune notification</p>
          <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>Vous êtes à jour !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map((n, i) => {
            const { Icon, bg, color } = getIcon(n.type);
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: n.is_read ? '#fff' : '#FFF8F7',
                borderRadius: 18, padding: '14px',
                border: `1.5px solid ${n.is_read ? '#F2F2F7' : '#FFE5E5'}`,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: n.is_read ? 600 : 800, color: '#1C1C1E', margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8353B', flexShrink: 0, marginTop: 3 }} />}
                  </div>
                  {n.message && <p style={{ fontSize: 13, color: '#636366', margin: '3px 0 4px', lineHeight: 1.4 }}>{n.message}</p>}
                  <p style={{ fontSize: 11, color: '#C7C7CC', margin: 0, fontWeight: 500 }}>{formatTime(n.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
