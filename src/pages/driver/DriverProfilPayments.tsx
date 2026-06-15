import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Tx {
  id: string;
  amount: number;
  description: string | null;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const DriverProfilPayments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id, amount, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (error) {
        console.error('Error loading wallet transactions:', error);
        setTransactions([]);
      } else {
        setTransactions((data ?? []) as Tx[]);
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
        <span className="font-semibold text-base">Paiements</span>
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
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-gray-500 text-center">
            Aucune transaction pour le moment
          </p>
        </div>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {t.description || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(t.created_at)}</p>
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount.toLocaleString('fr-FR')} CDF
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverProfilPayments;
