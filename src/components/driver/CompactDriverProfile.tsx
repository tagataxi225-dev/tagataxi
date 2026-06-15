import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Star, 
  Car, 
  Wallet, 
  Trophy, 
  Settings,
  QrCode,
  CreditCard
} from 'lucide-react';
import { DriverCodeManager } from './DriverCodeManager';
import { DriverChallenges } from './DriverChallenges';
import { ReferralDashboard } from './referral/ReferralDashboard';

interface DriverProfile {
  id: string;
  display_name: string;
  phone_number: string;
  avatar_url: string | null;
  user_type: string;
}

interface DriverStats {
  totalRides: number;
  avgRating: number;
  joinDate: string;
}

export const CompactDriverProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load driver stats
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('id, status')
        .eq('driver_id', user.id);

      if (bookingsError) throw bookingsError;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id);

      if (ratingsError) throw ratingsError;

      const completedRides = bookingsData?.filter(b => b.status === 'completed').length || 0;
      const avgRating = ratingsData?.length 
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length 
        : 0;

      setStats({
        totalRides: completedRides,
        avgRating: avgRating,
        joinDate: profileData?.created_at || new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJoinDuration = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? `${months} mois` : 'Nouveau';
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-xl"></div>
        <div className="h-48 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Compact Profile Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'DR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground truncate">{profile?.display_name || 'Chauffeur'}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile?.phone_number}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{stats?.avgRating.toFixed(1) || '0.0'}</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {stats?.totalRides || 0} courses
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Chauffeur Actif
          </Badge>
          {stats && stats.totalRides > 100 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
              Expert
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30">
          <TabsTrigger value="code" className="flex items-center gap-1 text-xs">
            <QrCode className="w-3 h-3" />
            Code
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1 text-xs">
            <Trophy className="w-3 h-3" />
            Défis
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1 text-xs">
            <User className="w-3 h-3" />
            Parrains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4">
          <DriverCodeManager />
        </TabsContent>

        <TabsContent value="challenges" className="mt-4">
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <DriverChallenges />
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <ReferralDashboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};