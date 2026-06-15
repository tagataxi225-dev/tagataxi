import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditProductForm } from '@/components/marketplace/EditProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function VendorEditProduct() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id, user]);

  const loadProduct = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Produit non trouvé",
          description: "Ce produit n'existe pas ou ne vous appartient pas",
          variant: "destructive"
        });
        navigate('/vendeur');
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le produit",
        variant: "destructive"
      });
      navigate('/vendeur');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/vendeur');
  };

  const handleUpdate = () => {
    loadProduct();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement du produit...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <EditProductForm 
        product={product} 
        onBack={handleBack} 
        onUpdate={handleUpdate} 
      />
    </div>
  );
}
