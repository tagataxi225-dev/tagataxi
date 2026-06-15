import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BookingRow {
  id: string;
  pickup_location: string | null;
  destination: string | null;
  actual_price: number | null;
  created_at: string;
}

const truncate = (s: string | null | undefined, max = 32) => {
  if (!s) return '—';
  const trimmed = s.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return '—';
  return `${amount.toLocaleString('fr-FR')} CDF`;
};

const DriverActivityHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, pickup_location, destination, actual_price, created_at')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error('Error loading activity history:', error);
        setBookings([]);
      } else {
        setBookings((data ?? []) as BookingRow[]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Historique d'activité</span>
      </div>

      {loading ? (
        <div className="flex-1 px-4 py-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-gray-500 text-center">
            Aucune course pour le moment
          </p>
        </div>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {formatDate(b.created_at)}
                </span>
                <span className="text-sm font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatAmount(b.actual_price)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                <span className="truncate flex-1">
                  {truncate(b.pickup_location)}
                </span>
                <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate flex-1 text-right">
                  {truncate(b.destination)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverActivityHistory;
