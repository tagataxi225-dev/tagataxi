import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2 } from 'lucide-react';

export const ApproveAllRentalsButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApproveAll = async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        `https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/admin-approve-all-rentals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'approbation');
      }

      toast({
        title: "✅ Véhicules approuvés",
        description: `${result.count} véhicule(s) approuvé(s) avec succès`,
      });

      // Rafraîchir la page après 1 seconde
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error approving rentals:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'approuver les véhicules",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleApproveAll}
      disabled={isLoading}
      className="gap-2"
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Approbation en cours...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          Approuver tous les véhicules
        </>
      )}
    </Button>
  );
};
