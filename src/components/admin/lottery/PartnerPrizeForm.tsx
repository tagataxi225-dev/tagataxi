import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartnerPrizes } from '@/hooks/usePartnerPrizes';
import { PRIZE_TYPE_CONFIG, RARITY_CONFIG } from '@/types/partner-prize';
import type { PartnerPrize, PrizeType, RarityTier } from '@/types/partner-prize';

interface PartnerPrizeFormProps {
  prize?: PartnerPrize | null;
  onClose: () => void;
}

export const PartnerPrizeForm: React.FC<PartnerPrizeFormProps> = ({ prize, onClose }) => {
  const { addPrize, updatePrize } = usePartnerPrizes();
  const isEditing = !!prize;

  const [formData, setFormData] = useState({
    partner_name: prize?.partner_name || '',
    partner_logo_url: prize?.partner_logo_url || '',
    name: prize?.name || '',
    description: prize?.description || '',
    prize_type: (prize?.prize_type || 'physical_gift') as PrizeType,
    estimated_value: prize?.estimated_value || 0,
    currency: prize?.currency || 'XOF',
    stock_quantity: prize?.stock_quantity || 1,
    stock_unlimited: prize?.stock_unlimited || false,
    rarity_tier: (prize?.rarity_tier || 'epic') as RarityTier,
    distribution_probability: prize?.distribution_probability || 0.01,
    is_active: prize?.is_active ?? true,
    requires_delivery: prize?.requires_delivery ?? true,
    delivery_instructions: prize?.delivery_instructions || '',
    claim_instructions: prize?.claim_instructions || '',
    image_url: prize?.image_url || '',
    gallery_urls: prize?.gallery_urls || [],
    valid_from: prize?.valid_from || null,
    valid_until: prize?.valid_until || null
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && prize) {
        await updatePrize.mutateAsync({ id: prize.id, ...formData });
      } else {
        await addPrize.mutateAsync(formData as any);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isEditing ? 'Modifier le prix' : 'Nouveau prix partenaire'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Partenaire */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du partenaire *</Label>
                <Input
                  value={formData.partner_name}
                  onChange={e => setFormData(f => ({ ...f, partner_name: e.target.value }))}
                  placeholder="Ex: Orange Money"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={formData.partner_logo_url || ''}
                  onChange={e => setFormData(f => ({ ...f, partner_logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Prix details */}
            <div className="space-y-2">
              <Label>Nom du prix *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: iPhone 15 Pro 256GB"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Description détaillée du prix..."
                rows={2}
              />
            </div>

            {/* Type et rareté */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de prix</Label>
                <Select 
                  value={formData.prize_type} 
                  onValueChange={(v: PrizeType) => setFormData(f => ({ ...f, prize_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIZE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rareté</Label>
                <Select 
                  value={formData.rarity_tier} 
                  onValueChange={(v: RarityTier) => setFormData(f => ({ ...f, rarity_tier: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RARITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valeur et stock */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valeur estimée</Label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={e => setFormData(f => ({ ...f, estimated_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={v => setFormData(f => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF</SelectItem>
                     <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={e => setFormData(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                    disabled={formData.stock_unlimited}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={formData.stock_unlimited}
                      onCheckedChange={v => setFormData(f => ({ ...f, stock_unlimited: v }))}
                    />
                    <span className="text-xs">∞</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Probabilité */}
            <div className="space-y-2">
              <Label>Probabilité de distribution (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(formData.distribution_probability * 100).toFixed(2)}
                onChange={e => setFormData(f => ({ 
                  ...f, 
                  distribution_probability: parseFloat(e.target.value) / 100 || 0 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage de chances qu'une carte de cette rareté attribue ce prix
              </p>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Image du prix</Label>
              <Input
                value={formData.image_url || ''}
                onChange={e => setFormData(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Instructions de réclamation</Label>
              <Textarea
                value={formData.claim_instructions || ''}
                onChange={e => setFormData(f => ({ ...f, claim_instructions: e.target.value }))}
                placeholder="Ex: Présentez ce QR code en boutique Orange Money..."
                rows={2}
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData(f => ({ ...f, is_active: v }))}
                />
                <Label>Actif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.requires_delivery}
                  onCheckedChange={v => setFormData(f => ({ ...f, requires_delivery: v }))}
                />
                <Label>Nécessite livraison</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
