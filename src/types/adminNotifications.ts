// Shared type for admin system notifications across the app
export interface AdminSystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}