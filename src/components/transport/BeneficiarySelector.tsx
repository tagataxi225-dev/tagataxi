import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Star, Phone, User2, Heart } from 'lucide-react';
import { useBeneficiaries, BeneficiaryData, NewBeneficiaryData } from '@/hooks/useBeneficiaries';
import { toast } from 'sonner';

interface BeneficiarySelectorProps {
  isForSomeoneElse: boolean;
  onToggle: (value: boolean) => void;
  selectedBeneficiary: BeneficiaryData | null;
  onSelectBeneficiary: (beneficiary: BeneficiaryData | null) => void;
}

export default function BeneficiarySelector({
  isForSomeoneElse,
  onToggle,
  selectedBeneficiary,
  onSelectBeneficiary
}: BeneficiarySelectorProps) {
  const { beneficiaries, addBeneficiary } = useBeneficiaries();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBenName, setNewBenName] = useState('');
  const [newBenPhone, setNewBenPhone] = useState('');
  const [newBenRelation, setNewBenRelation] = useState('friend');

  const handleAddNewBeneficiary = async () => {
    if (!newBenName.trim() || !newBenPhone.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const data: NewBeneficiaryData = {
      name: newBenName.trim(),
      phone: newBenPhone.trim(),
      relationship: newBenRelation
    };

    const result = await addBeneficiary(data);
    if (result) {
      onSelectBeneficiary(result);
      setShowAddForm(false);
      setNewBenName('');
      setNewBenPhone('');
      setNewBenRelation('friend');
    }
  };

  return (
    <div className="space-y-4 px-4 py-3 bg-muted/20 rounded-2xl">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-sm border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Réserver pour quelqu'un d'autre</p>
            <p className="text-xs text-muted-foreground">Offrez un trajet à un proche</p>
          </div>
        </div>
        <Switch checked={isForSomeoneElse} onCheckedChange={onToggle} />
      </div>

      {/* Liste des bénéficiaires (si toggle activé) */}
      <AnimatePresence>
        {isForSomeoneElse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {!showAddForm ? (
              <>
                {/* Liste des contacts */}
                {beneficiaries.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {beneficiaries.map((ben) => (
                      <motion.button
                        key={ben.id}
                        onClick={() => onSelectBeneficiary(ben)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                          selectedBeneficiary?.id === ben.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            selectedBeneficiary?.id === ben.id ? 'bg-primary' : 'bg-muted'
                          }`}>
                            <User2 className={`w-4 h-4 ${
                              selectedBeneficiary?.id === ben.id ? 'text-primary-foreground' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{ben.name}</p>
                              {ben.is_favorite && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {ben.phone}
                            </p>
                          </div>
                          {ben.usage_count && ben.usage_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {ben.usage_count} course{ben.usage_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Bouton "Ajouter un nouveau contact" */}
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-dashed"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nouveau bénéficiaire
                </Button>
              </>
            ) : (
              /* Formulaire d'ajout */
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 bg-background rounded-xl border border-border"
              >
                <div className="space-y-2">
                  <Label htmlFor="ben-name" className="text-xs">Nom complet</Label>
                  <Input
                    id="ben-name"
                    placeholder="Ex: Jean Mukendi"
                    value={newBenName}
                    onChange={(e) => setNewBenName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ben-phone" className="text-xs">Téléphone</Label>
                  <Input
                    id="ben-phone"
                    type="tel"
                    placeholder="+243 XX XXX XXXX"
                    value={newBenPhone}
                    onChange={(e) => setNewBenPhone(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ben-relation" className="text-xs">Relation</Label>
                  <Select value={newBenRelation} onValueChange={setNewBenRelation}>
                    <SelectTrigger id="ben-relation" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Famille
                        </div>
                      </SelectItem>
                      <SelectItem value="friend">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Ami(e)
                        </div>
                      </SelectItem>
                      <SelectItem value="colleague">Collègue</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBenName('');
                      setNewBenPhone('');
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddNewBeneficiary}
                    className="flex-1"
                  >
                    Ajouter
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
