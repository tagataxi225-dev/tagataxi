import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Send, Users, Eye, Bell, CheckCircle2, AlertTriangle, Clock, 
  Smartphone, Zap, FileText, TestTube, Loader2, 
  Car, Package, Gift, CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationCampaigns } from '@/hooks/useNotificationCampaigns';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/utils/edgeFunctionConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TARGET_OPTIONS = [
  { value: 'all_clients', label: 'Tous les clients', icon: Users, description: 'Utilisateurs de l\'app qui commandent des services', color: 'bg-blue-500' },
  { value: 'all_drivers', label: 'Tous les chauffeurs', icon: Car, description: 'Chauffeurs actifs et inactifs', color: 'bg-green-500' },
  { value: 'active_drivers', label: 'Chauffeurs actifs', icon: CheckCircle2, description: 'Chauffeurs vérifiés et actifs uniquement', color: 'bg-emerald-500' },
  { value: 'verified_drivers', label: 'Chauffeurs vérifiés', icon: CheckCircle2, description: 'Chauffeurs avec vérification complète', color: 'bg-teal-500' },
  { value: 'all_partners', label: 'Tous les partenaires', icon: Users, description: 'Partenaires de la plateforme', color: 'bg-purple-500' },
  { value: 'all_vendors', label: 'Tous les vendeurs', icon: Package, description: 'Vendeurs du marketplace', color: 'bg-orange-500' },
  { value: 'zone_users', label: 'Par zone géographique', icon: Users, description: 'Utilisateurs d\'une ville spécifique', color: 'bg-indigo-500' }
];

const TEMPLATES = [
  { id: 'promo', title: '🎉 Promotion', message: 'Profitez de -20% sur votre prochaine course !', type: 'marketing' },
  { id: 'update', title: '🚀 Mise à jour', message: 'Nouvelle version disponible avec des améliorations.', type: 'system' },
  { id: 'reward', title: '🎁 Récompense', message: 'Vous avez gagné des crédits bonus !', type: 'reward' },
  { id: 'reminder', title: '⏰ Rappel', message: 'N\'oubliez pas de compléter votre profil.', type: 'reminder' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', description: 'Notifications silencieuses', color: 'text-muted-foreground' },
  { value: 'normal', label: 'Normale', description: 'Notification standard', color: 'text-primary' },
  { value: 'high', label: 'Élevée', description: 'Son et vibration', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgente', description: 'Notification prioritaire', color: 'text-destructive' }
];

interface RecipientCount {
  count: number;
  loading: boolean;
}

export const NotificationSendForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates'>('compose');
  const [form, setForm] = useState({
    target_type: 'all_clients',
    title: '',
    message: '',
    priority: 'normal',
    city: 'Kinshasa',
    sound: true,
    vibration: true
  });

  const [recipientCount, setRecipientCount] = useState<RecipientCount>({
    count: 0,
    loading: false
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const { createCampaign, updateCampaignStats, refreshCampaigns } = useNotificationCampaigns();

  // Calculate recipients
  const calculateRecipients = async (targetType: string, city?: string) => {
    setRecipientCount({ count: 0, loading: true });

    try {
      let query;
      
      switch (targetType) {
        case 'all_clients':
          query = supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'all_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'active_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .in('verification_status', ['verified', 'approved']);
          break;
        case 'verified_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .eq('verification_status', 'verified')
            .eq('is_active', true);
          break;
        case 'all_partners':
          query = supabase.from('partenaires').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'all_vendors':
          query = supabase.from('seller_profiles').select('id', { count: 'exact', head: true }).eq('verified_seller', true);
          break;
        case 'zone_users':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .contains('service_areas', [city || 'Kinshasa'])
            .eq('is_active', true);
          break;
        default:
          setRecipientCount({ count: 0, loading: false });
          return;
      }

      const { count, error } = await query;
      
      if (error) {
        console.error('Erreur calcul destinataires:', error);
        setRecipientCount({ count: 0, loading: false });
        return;
      }

      setRecipientCount({ count: count || 0, loading: false });
    } catch (error) {
      console.error('Erreur calcul destinataires:', error);
      setRecipientCount({ count: 0, loading: false });
    }
  };

  // Test send to admin
  const handleTestSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Le titre et le message sont obligatoires');
      return;
    }

    setTestSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      await callEdgeFunction('push-notifications', {
        user_id: user.id,
        title: `[TEST] ${form.title.trim()}`,
        message: form.message.trim(),
        type: 'system',
        priority: form.priority,
        sound: form.sound,
        vibration: form.vibration
      });

      toast.success('Notification test envoyée !');
    } catch (error) {
      console.error('Erreur test:', error);
      toast.error('Erreur lors de l\'envoi test');
    } finally {
      setTestSending(false);
    }
  };

  // Send notification
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Le titre et le message sont obligatoires');
      return;
    }

    if (recipientCount.count === 0) {
      toast.error('Aucun destinataire trouvé pour cette sélection');
      return;
    }

    setSending(true);

    try {
      // Create campaign and get the ID back
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data: campaignData, error: campaignError } = await supabase
        .from('notification_campaign_history')
        .insert([{
          campaign_title: form.title.trim(),
          message_content: form.message.trim(),
          target_type: form.target_type,
          target_criteria: form.target_type === 'zone_users' ? { city: form.city } : {},
          priority: form.priority,
          sent_by: userData.user.id,
          status: 'sending'
        }])
        .select('id')
        .single();

      if (campaignError || !campaignData) {
        toast.error('Erreur lors de la création de la campagne');
        setSending(false);
        return;
      }

      const campaignId = campaignData.id;

      // Map frontend target_type to backend target_audience
      const mapTargetType = (targetType: string): string => {
        const mapping: Record<string, string> = {
          'all_clients': 'clients',
          'all_drivers': 'drivers',
          'active_drivers': 'drivers',
          'verified_drivers': 'drivers',
          'all_partners': 'partners',
          'all_vendors': 'vendors',
          'zone_users': 'clients'
        };
        return mapping[targetType] || 'all';
      };

      try {
        const response = await callEdgeFunction('push-notifications-broadcast', {
          title: form.title.trim(),
          message: form.message.trim(),
          target_audience: mapTargetType(form.target_type),
          target_city: form.target_type === 'zone_users' ? form.city : undefined,
          priority: form.priority,
          type: 'announcement',
          sound: form.sound,
          vibration: form.vibration
        });

        // Update campaign with real stats from broadcast response
        const stats = response?.stats || {};
        await updateCampaignStats(campaignId, {
          sent_count: stats.sent || 0,
          delivered_count: stats.sent || 0,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        toast.success(`Notification envoyée à ${stats.sent || recipientCount.count} destinataires`);
        
        // Reset form
        setForm({
          target_type: 'all_clients',
          title: '',
          message: '',
          priority: 'normal',
          city: 'Kinshasa',
          sound: true,
          vibration: true
        });
        setPreviewMode(false);
        refreshCampaigns();
      } catch (edgeError) {
        console.error('Erreur Edge Function:', edgeError);
        // Mark campaign as failed
        await updateCampaignStats(campaignId, {
          status: 'failed'
        });
        toast.warning('Campagne créée mais erreur d\'envoi. Vérifier les logs.');
      }

    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message
    }));
    setActiveTab('compose');
    toast.success('Template appliqué');
  };

  useEffect(() => {
    calculateRecipients(form.target_type, form.city);
  }, [form.target_type, form.city]);

  const targetInfo = TARGET_OPTIONS.find(option => option.value === form.target_type) || TARGET_OPTIONS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose" className="gap-2">
              <FileText className="w-4 h-4" />
              Composer
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Zap className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6 mt-6">
            {!previewMode ? (
              <>
                {/* Recipients */}
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Destinataires
                    </CardTitle>
                    <CardDescription>
                      Choisissez qui recevra cette notification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TARGET_OPTIONS.map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            onClick={() => setForm(prev => ({ ...prev, target_type: option.value }))}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all",
                              form.target_type === option.value 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", option.color, "bg-opacity-20")}>
                                <option.icon className={cn("w-4 h-4", option.color.replace('bg-', 'text-'))} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {form.target_type === 'zone_users' && (
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Select 
                          value={form.city} 
                          onValueChange={(value) => setForm(prev => ({ ...prev, city: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Kinshasa">🇨🇩 Kinshasa</SelectItem>
                            <SelectItem value="Lubumbashi">🇨🇩 Lubumbashi</SelectItem>
                            <SelectItem value="Kolwezi">🇨🇩 Kolwezi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Destinataires estimés</span>
                        {recipientCount.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Badge variant={recipientCount.count > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                            {recipientCount.count.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Contenu
                    </CardTitle>
                    <CardDescription>
                      Rédigez le message à envoyer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Nouvelle fonctionnalité disponible"
                        maxLength={100}
                        className="text-lg"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {form.title.length}/100
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Rédigez votre message ici..."
                        rows={5}
                        maxLength={500}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {form.message.length}/500
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-3">
                      <Label>Priorité</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PRIORITY_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => setForm(prev => ({ ...prev, priority: option.value }))}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer text-center transition-all",
                              form.priority === option.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <p className={cn("font-medium text-sm", option.color)}>{option.label}</p>
                            <p className="text-[10px] text-muted-foreground">{option.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={form.sound}
                          onCheckedChange={(checked) => setForm(prev => ({ ...prev, sound: checked }))}
                        />
                        <Label className="text-sm">Son</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={form.vibration}
                          onCheckedChange={(checked) => setForm(prev => ({ ...prev, vibration: checked }))}
                        />
                        <Label className="text-sm">Vibration</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Preview Mode */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Aperçu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Device mockup */}
                  <div className="flex justify-center">
                    <div className="relative w-[280px] bg-gradient-to-b from-muted to-muted/50 rounded-[2.5rem] p-3 shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
                      
                      {/* Screen */}
                      <div className="bg-background rounded-[2rem] pt-10 pb-4 px-4 min-h-[400px]">
                        {/* Status bar */}
                        <div className="flex justify-between text-xs text-muted-foreground mb-6">
                          <span>9:41</span>
                          <div className="flex gap-1">
                            <span>5G</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Notification */}
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border rounded-2xl p-4 shadow-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                              <Bell className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">TAGA</p>
                                <span className="text-[10px] text-muted-foreground">maintenant</span>
                              </div>
                              <p className="font-medium text-sm mt-1">
                                {form.title || 'Titre de la notification'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {form.message || 'Contenu de la notification...'}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            PRIORITY_OPTIONS.find(p => p.value === form.priority)?.color
                          )}>
                            {form.priority}
                          </Badge>
                          {form.sound && <span>🔊</span>}
                          {form.vibration && <span>📳</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de notification</CardTitle>
                <CardDescription>Utilisez un modèle pré-défini pour gagner du temps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEMPLATES.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => applyTemplate(template)}
                        className="p-4 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <p className="font-medium">{template.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.message}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">{template.type}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Actions Sidebar */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={!form.title && !form.message}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Éditer' : 'Aperçu'}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleTestSend}
              disabled={testSending || !form.title || !form.message}
            >
              {testSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Envoi test
            </Button>
            
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={sending || !form.title || !form.message || recipientCount.count === 0}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Envoyer à {recipientCount.count.toLocaleString()}
            </Button>

            {recipientCount.count > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                La notification sera envoyée immédiatement
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSendForm;
