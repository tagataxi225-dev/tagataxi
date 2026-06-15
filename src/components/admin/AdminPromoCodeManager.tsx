import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  currency: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  user_limit?: number;
  valid_from: string;
  valid_until: string;
  applicable_services?: string[];
  is_active: boolean;
  is_published: boolean;
  scheduled_publish_at?: string;
  created_by?: string;
  created_at: string;
}

export const AdminPromoCodeManager = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    currency: 'CDF',
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: '',
    user_limit: 1,
    valid_from: '',
    valid_until: '',
    applicable_services: ['transport', 'delivery', 'marketplace'],
    is_active: true,
    is_published: false,
    scheduled_publish_at: ''
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des codes promo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les codes promo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const codeData = {
        ...formData,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        max_discount_amount: formData.max_discount_amount || null,
        scheduled_publish_at: formData.scheduled_publish_at || null,
        created_by: editingCode ? undefined : (await supabase.auth.getUser()).data.user?.id
      };

      let result;
      if (editingCode) {
        result = await supabase
          .from('promo_codes')
          .update(codeData)
          .eq('id', editingCode.id);
      } else {
        result = await supabase
          .from('promo_codes')
          .insert([codeData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Succès",
        description: `Code promo ${editingCode ? 'modifié' : 'créé'} avec succès`
      });

      fetchPromoCodes();
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_published: !code.is_published })
        .eq('id', code.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Code promo ${!code.is_published ? 'publié' : 'dépublié'}`
      });

      fetchPromoCodes();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Code promo supprimé"
      });

      fetchPromoCodes();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      currency: 'CDF',
      min_order_amount: 0,
      max_discount_amount: 0,
      usage_limit: '',
      user_limit: 1,
      valid_from: '',
      valid_until: '',
      applicable_services: ['transport', 'delivery', 'marketplace'],
      is_active: true,
      is_published: false,
      scheduled_publish_at: ''
    });
    setEditingCode(null);
    setShowForm(false);
  };

  const startEdit = (code: PromoCode) => {
    setFormData({
      code: code.code,
      title: code.title,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      currency: code.currency,
      min_order_amount: code.min_order_amount || 0,
      max_discount_amount: code.max_discount_amount || 0,
      usage_limit: code.usage_limit?.toString() || '',
      user_limit: code.user_limit || 1,
      valid_from: code.valid_from.split('T')[0],
      valid_until: code.valid_until.split('T')[0],
      applicable_services: code.applicable_services || [],
      is_active: code.is_active,
      is_published: code.is_published,
      scheduled_publish_at: code.scheduled_publish_at?.split('T')[0] || ''
    });
    setEditingCode(code);
    setShowForm(true);
  };

  if (isLoading && promoCodes.length === 0) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des codes promo</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau code promo
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Codes actifs</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="expired">Expirés</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {promoCodes.filter(code => code.is_published && code.is_active).map(code => (
            <PromoCodeCard key={code.id} code={code} onEdit={startEdit} onDelete={handleDelete} onPublishToggle={handlePublishToggle} />
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {promoCodes.filter(code => !code.is_published).map(code => (
            <PromoCodeCard key={code.id} code={code} onEdit={startEdit} onDelete={handleDelete} onPublishToggle={handlePublishToggle} />
          ))}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {promoCodes.filter(code => new Date(code.valid_until) < new Date()).map(code => (
            <PromoCodeCard key={code.id} code={code} onEdit={startEdit} onDelete={handleDelete} onPublishToggle={handlePublishToggle} />
          ))}
        </TabsContent>
      </Tabs>

      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{editingCode ? 'Modifier' : 'Créer'} un code promo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code promo</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Promo d'été"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la promotion"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount_type">Type de remise</Label>
                  <Select value={formData.discount_type} onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                      <SelectItem value="free_delivery">Livraison gratuite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">Valeur de remise</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="min_order_amount">Commande minimale</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Date de début</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Date de fin</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publié</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingCode ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const PromoCodeCard = ({ 
  code, 
  onEdit, 
  onDelete, 
  onPublishToggle 
}: { 
  code: PromoCode; 
  onEdit: (code: PromoCode) => void; 
  onDelete: (id: string) => void;
  onPublishToggle: (code: PromoCode) => void;
}) => {
  const isExpired = new Date(code.valid_until) < new Date();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg">{code.code}</CardTitle>
          <Badge variant={code.is_published ? "default" : "secondary"}>
            {code.is_published ? "Publié" : "Brouillon"}
          </Badge>
          {isExpired && <Badge variant="destructive">Expiré</Badge>}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPublishToggle(code)}
            title={code.is_published ? "Dépublier" : "Publier"}
          >
            {code.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(code)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(code.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-medium">{code.title}</p>
          {code.description && <p className="text-sm text-muted-foreground">{code.description}</p>}
          <div className="flex items-center space-x-4 text-sm">
            <span>
              {code.discount_type === 'percentage' && `${code.discount_value}% de remise`}
              {code.discount_type === 'fixed_amount' && `${code.discount_value} ${code.currency} de remise`}
              {code.discount_type === 'free_delivery' && 'Livraison gratuite'}
            </span>
            <span>Utilisé: {code.usage_count}/{code.usage_limit || '∞'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Valide du {format(new Date(code.valid_from), 'dd/MM/yyyy')} au {format(new Date(code.valid_until), 'dd/MM/yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};