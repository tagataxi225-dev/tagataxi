/**
 * AdminRatingsManager — Vue admin complète des évaluations
 * - Toutes les évaluations clients et chauffeurs
 * - Stats par utilisateur
 * - Actions : signaler, suspendre utilisateur faible score
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, TrendingDown, AlertTriangle, User, Car, Search, RefreshCw } from 'lucide-react';

interface Rating {
  id: string;
  rated_user_id: string;
  rater_user_id: string;
  rating: number;
  comment: string | null;
  booking_id: string | null;
  delivery_id: string | null;
  created_at: string;
  rated_name?: string;
  rater_name?: string;
}

interface UserStats {
  user_id: string;
  display_name: string;
  role: string;
  avg_rating: number;
  total_ratings: number;
  negative_ratings: number;
  positive_ratings: number;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          fill={i <= value ? '#FF9F0A' : 'none'}
          color={i <= value ? '#FF9F0A' : '#C7C7CC'} />
      ))}
    </div>
  );
}

export default function AdminRatingsManager() {
  const [tab, setTab] = useState<'recent' | 'stats' | 'alerts'>('recent');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const loadRatings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_ratings')
        .select(`
          id, rated_user_id, rater_user_id, rating, comment,
          booking_id, delivery_id, created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        // Enrichir avec les noms
        const allIds = [...new Set([...data.map(r => r.rated_user_id), ...data.map(r => r.rater_user_id)])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', allIds);

        const pMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));
        setRatings(data.map(r => ({
          ...r,
          rated_name: pMap.get(r.rated_user_id) || 'Utilisateur',
          rater_name: pMap.get(r.rater_user_id) || 'Anonyme',
        })));
      }

      // Stats par utilisateur
      const { data: stats } = await supabase
        .from('v_user_rating_stats')
        .select('*')
        .order('avg_rating', { ascending: true });

      if (stats) {
        const statIds = stats.map((s: any) => s.user_id);
        const { data: sprof } = await supabase
          .from('profiles')
          .select('user_id, display_name, user_roles(role)')
          .in('user_id', statIds);

        const sMap = new Map((sprof || []).map(p => [p.user_id, p]));
        setUserStats(stats.map((s: any) => {
          const p = sMap.get(s.user_id) as any;
          const role = p?.user_roles?.[0]?.role || 'client';
          return {
            user_id: s.user_id,
            display_name: p?.display_name || 'Utilisateur',
            role,
            avg_rating: parseFloat(s.avg_rating) || 0,
            total_ratings: parseInt(s.total_ratings) || 0,
            negative_ratings: parseInt(s.negative_ratings) || 0,
            positive_ratings: parseInt(s.positive_ratings) || 0,
          };
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRatings(); }, []);

  const filtered = ratings.filter(r => {
    if (search && !r.rated_name?.toLowerCase().includes(search.toLowerCase()) &&
        !r.rater_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRating && r.rating !== filterRating) return false;
    return true;
  });

  const alerts = userStats.filter(u => u.avg_rating < 3 && u.total_ratings >= 3);
  const avgOverall = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : '—';

  return (
    <div style={{ fontFamily: F, maxWidth: 900, margin: '0 auto', padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C1C1E', margin: 0 }}>Évaluations</h1>
          <p style={{ fontSize: 13, color: '#8E8E93', margin: '4px 0 0' }}>Gestion des avis clients & chauffeurs</p>
        </div>
        <button onClick={loadRatings} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#636366' }}>
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total avis', value: ratings.length, color: '#0A84FF', icon: Star },
          { label: 'Note moyenne', value: avgOverall, color: '#FF9F0A', icon: Star },
          { label: 'Avis négatifs', value: ratings.filter(r => r.rating <= 2).length, color: '#E8353B', icon: TrendingDown },
          { label: 'Alertes', value: alerts.length, color: '#FF9F0A', icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1.5px solid #F2F2F7', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: '0 0 4px', letterSpacing: -1 }}>{loading ? '…' : s.value}</p>
            <p style={{ fontSize: 11, color: '#8E8E93', margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'recent', label: 'Récents' },
          { key: 'stats', label: 'Par utilisateur' },
          { key: 'alerts', label: `Alertes (${alerts.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: tab === t.key ? '#1C1C1E' : '#F2F2F7',
              color: tab === t.key ? '#fff' : '#636366' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Recent ratings */}
      {tab === 'recent' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
                style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, border: '1.5px solid #E5E5EA', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <select value={filterRating || ''} onChange={e => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #E5E5EA', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">Toutes les notes</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} étoile{n>1?'s':''}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: `1.5px solid ${r.rating <= 2 ? '#FFE5E5' : '#F2F2F7'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Stars value={r.rating} />
                      <span style={{ fontSize: 12, color: '#8E8E93' }}>
                        <strong style={{ color: '#1C1C1E' }}>{r.rater_name}</strong> → <strong style={{ color: '#1C1C1E' }}>{r.rated_name}</strong>
                      </span>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: '#636366', margin: '4px 0 0', fontStyle: 'italic' }}>"{r.comment}"</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: r.rating <= 2 ? '#E8353B' : r.rating >= 4 ? '#30D158' : '#FF9F0A' }}>{r.rating}</div>
                    <p style={{ fontSize: 10, color: '#C7C7CC', margin: 0 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93' }}>Aucun avis trouvé</div>
            )}
          </div>
        </>
      )}

      {/* Stats by user */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {userStats.map(u => (
            <div key={u.user_id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #F2F2F7', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: u.role === 'driver' ? '#FFF3E0' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {u.role === 'driver' ? <Car size={18} color="#FF9F0A" /> : <User size={18} color="#0A84FF" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', margin: '0 0 4px' }}>{u.display_name}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Stars value={Math.round(u.avg_rating)} />
                  <span style={{ fontSize: 12, color: '#8E8E93' }}>{u.total_ratings} avis</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: u.avg_rating < 3 ? '#E8353B' : u.avg_rating >= 4 ? '#30D158' : '#FF9F0A', margin: 0, letterSpacing: -0.5 }}>{u.avg_rating.toFixed(1)}</p>
                <p style={{ fontSize: 10, color: '#C7C7CC', margin: 0 }}>{u.negative_ratings} négatifs</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {tab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#8E8E93' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <p>Aucun utilisateur avec une note critique</p>
            </div>
          ) : alerts.map(u => (
            <div key={u.user_id} style={{ background: '#FFF1F0', borderRadius: 16, padding: '16px', border: '1.5px solid #FFD5D5', display: 'flex', alignItems: 'center', gap: 14 }}>
              <AlertTriangle size={24} color="#E8353B" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1E', margin: '0 0 2px' }}>{u.display_name}</p>
                <p style={{ fontSize: 13, color: '#636366', margin: 0 }}>Moyenne : {u.avg_rating.toFixed(1)}/5 · {u.total_ratings} avis · {u.negative_ratings} négatifs</p>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#E8353B', letterSpacing: -1 }}>{u.avg_rating.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
