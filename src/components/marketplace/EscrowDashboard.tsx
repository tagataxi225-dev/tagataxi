import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface EscrowPayment {
  id: string;
  amount: number;
  currency: string | null;
  status: string;
  transaction_reference: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  held: { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  released: { label: 'Libéré', className: 'bg-emerald-50 text-emerald-700' },
  refunded: { label: 'Remboursé', className: 'bg-red-50 text-red-700' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const truncateRef = (ref: string | null) => {
  if (!ref) return '—';
  if (ref.length <= 16) return ref;
  return `${ref.slice(0, 8)}…${ref.slice(-4)}`;
};

export const EscrowDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<EscrowPayment[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('escrow_payments')
        .select('id, amount, currency, status, transaction_reference, created_at')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('Error loading escrow payments:', error);
        setPayments([]);
      } else {
        setPayments((data ?? []) as EscrowPayment[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totals = payments.reduce(
    (acc, p) => {
      const status = p.status?.toLowerCase();
      if (status === 'held') acc.held += p.amount;
      else if (status === 'released') acc.released += p.amount;
      else if (status === 'refunded') acc.refunded += p.amount;
      return acc;
    },
    { held: 0, released: 0, refunded: 0 }
  );

  const fmtAmount = (n: number) => n.toLocaleString('fr-FR');

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">En attente</p>
          <p className="text-base font-bold text-amber-800 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtAmount(totals.held)}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Libérés</p>
          <p className="text-base font-bold text-emerald-800 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtAmount(totals.released)}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Remboursés</p>
          <p className="text-base font-bold text-red-800 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtAmount(totals.refunded)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun paiement escrow pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const style = STATUS_STYLES[p.status?.toLowerCase()] ?? {
              label: p.status,
              className: 'bg-gray-100 text-gray-700',
            };
            return (
              <div key={p.id} className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtAmount(p.amount)} {p.currency ?? 'CDF'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(p.created_at)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Réf : {truncateRef(p.transaction_reference)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EscrowDashboard;
