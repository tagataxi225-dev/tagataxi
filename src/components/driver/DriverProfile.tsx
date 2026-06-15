import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  User, Star, Car, Wallet, Trophy, Calendar,
  CreditCard, Plus, History, Settings, Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DriverChallenges } from './DriverChallenges';
import { ReferralDashboard } from './referral/ReferralDashboard';
import { DriverTransactionHistory } from './DriverTransactionHistory';
import { DriverProfileEditor } from './DriverProfileEditor';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';

interface DriverProfile {
  id: string;
  display_name: string;
  phone_number: string;
  avatar_url: string | null;
  user_type: string;
}

interface DriverRequest {
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_year: number;
  status: string;
}

interface DriverStats {
  totalRides: number;
  avgRating: number;
  joinDate: string;
}

export const DriverProfile = () => {
  const { user } = useAuth();
  const { wallet, transactions, loading: walletLoading, topUpWallet } = useWallet();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [driverRequest, setDriverRequest] = useState<DriverRequest | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpProvider, setTopUpProvider] = useState('');
  const [topUpPhone, setTopUpPhone] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: driverData, error: driverError } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (driverError) throw driverError;
      setDriverRequest(driverData);

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
      toast.error(t('driver.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || !topUpProvider || !topUpPhone) {
      toast.error(t('driver.fill_all_fields'));
      return;
    }

    const amount = parseFloat(topUpAmount);
    if (amount < 1000) {
      toast.error(t('driver.min_amount'));
      return;
    }

    const success = await topUpWallet(amount, topUpProvider, topUpPhone);
    if (success) {
      setShowTopUpModal(false);
      setTopUpAmount('');
      setTopUpProvider('');
      setTopUpPhone('');
    }
  };

  const formatAmount = (amount: number) => formatCurrency(amount, 'CDF');

  const getJoinDuration = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? t('driver.months_count', { count: months }) : t('driver.new');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
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
            <h2 className="font-bold text-foreground truncate">{profile?.display_name || t('driver_header.driver')}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile?.phone_number}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{stats?.avgRating.toFixed(1) || '0.0'}</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {t('driver.rides_count', { count: stats?.totalRides || 0 })}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            {t('driver.active')}
          </Badge>
          {stats && stats.totalRides > 100 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
              {t('driver.expert')}
            </Badge>
          )}
        </div>
      </div>

      {/* Vehicle Info */}
      {driverRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>{t('driver.vehicle')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">{t('driver.vehicle_type')}</Label>
                <p className="font-medium">{driverRequest.vehicle_type}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t('driver.vehicle_model')}</Label>
                <p className="font-medium">{driverRequest.vehicle_model}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t('driver.vehicle_plate')}</Label>
                <p className="font-medium">{driverRequest.vehicle_plate}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t('driver.vehicle_year')}</Label>
                <p className="font-medium">{driverRequest.vehicle_year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>{t('driver.wallet')}</span>
            </div>
            <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('driver.topup')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('driver.topup_wallet')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">{t('driver.amount_cdf')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="1000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">{t('driver.provider')}</Label>
                    <Select value={topUpProvider} onValueChange={setTopUpProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('driver.choose_provider')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="airtel">Airtel Money</SelectItem>
                        <SelectItem value="orange">Orange Money</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('driver.phone_number')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+243..."
                      value={topUpPhone}
                      onChange={(e) => setTopUpPhone(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    className="w-full"
                    disabled={walletLoading}
                  >
                    {walletLoading ? t('driver.processing') : t('driver.topup')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('driver.available_balance')}</p>
              <p className="text-3xl font-bold text-primary">
                {wallet ? formatAmount(wallet.balance) : '0 CDF'}
              </p>
            </div>
            
            {transactions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <History className="h-4 w-4" />
                  <span className="font-medium">{t('driver.recent_transactions')}</span>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={`font-medium ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {t('driver.wallet')}
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {t('driver.challenges')}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('driver.referrals')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{t('driver.quick_actions')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col space-y-1"
                  onClick={() => setHistoryOpen(true)}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">{t('driver.full_history')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col space-y-1"
                  onClick={() => setProfileEditorOpen(true)}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">{t('driver.edit_profile')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <DriverChallenges />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralDashboard />
        </TabsContent>
      </Tabs>

      {/* Transaction History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>{t('driver.full_transaction_history')}</span>
            </DialogTitle>
          </DialogHeader>
          <DriverTransactionHistory />
        </DialogContent>
      </Dialog>

      {/* Profile Editor Dialog */}
      <Dialog open={profileEditorOpen} onOpenChange={setProfileEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>{t('driver.edit_profile_title')}</span>
            </DialogTitle>
          </DialogHeader>
          <DriverProfileEditor />
        </DialogContent>
      </Dialog>

      <LegalFooterLinks />
    </div>
  );
};
