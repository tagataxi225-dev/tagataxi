import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DriverProfilPhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('phone_number')
        .eq('user_id', user.id)
        .single();

      if (cancelled) return;

      if (error) {
        console.error('Error loading phone number:', error);
        toast.error('Impossible de charger le numéro');
      } else if (data) {
        setCurrentPhone(data.phone_number ?? '');
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const trimmed = newPhone.trim();
    if (!trimmed) {
      toast.error('Veuillez entrer un nouveau numéro');
      return;
    }
    if (trimmed === currentPhone) {
      toast.error('Le nouveau numéro est identique à l\'actuel');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('chauffeurs')
      .update({ phone_number: trimmed })
      .eq('user_id', user.id);
    setSaving(false);

    if (error) {
      console.error('Error updating phone number:', error);
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    setCurrentPhone(trimmed);
    setNewPhone('');
    toast.success('Numéro mis à jour');
  };

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
        <span className="font-semibold text-base">Numéro de téléphone</span>
      </div>

      {loading ? (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl p-4 space-y-4 border">
            <div className="space-y-2">
              <Label htmlFor="current_phone" className="text-sm text-gray-600">
                Numéro actuel
              </Label>
              <Input
                id="current_phone"
                value={currentPhone}
                readOnly
                className="bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_phone" className="text-sm text-gray-600">
                Nouveau numéro
              </Label>
              <Input
                id="new_phone"
                type="tel"
                inputMode="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+243 ..."
                className="bg-white"
              />
              <p className="text-xs text-gray-500">
                Entrez le nouveau numéro avec l'indicatif pays
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DriverProfilPhone;
