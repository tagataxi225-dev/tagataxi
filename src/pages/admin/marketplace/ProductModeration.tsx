import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, Package, Calendar, User, MapPin, Edit } from "lucide-react";
import { EditProductForm } from "@/components/marketplace/EditProductForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: any;
  location: string;
  seller_id: string;
  moderation_status: string;
  created_at: string;
  moderated_at?: string | null;
  moderator_id?: string | null;
  status: string;
  seller_name?: string;
  seller_phone?: string;
}

export const ProductModeration = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch seller info separately
      const productsWithSellers = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: sellerData } = await supabase
            .from("clients")
            .select("display_name, phone_number")
            .eq("user_id", product.seller_id)
            .single();

          return {
            ...product,
            seller_name: sellerData?.display_name,
            seller_phone: sellerData?.phone_number,
          };
        })
      );

      setProducts(productsWithSellers);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();

    // Real-time subscription pour nouveaux produits
    const channel = supabase
      .channel("product-moderation-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "marketplace_products",
          filter: "moderation_status=eq.pending",
        },
        (payload) => {
          fetchPendingProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (productId: string) => {
    try {
      setProcessingAction(true);
      
      // Récupérer infos produit + seller
      const { data: product, error: fetchError } = await supabase
        .from("marketplace_products")
        .select("seller_id, title")
        .eq("id", productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Approuver le produit
      const { error } = await supabase
        .from("marketplace_products")
        .update({
          moderation_status: "approved",
          moderated_at: new Date().toISOString(),
          moderator_id: (await supabase.auth.getUser()).data.user?.id,
          status: "active",
        })
        .eq("id", productId);

      if (error) throw error;

      // ✅ Créer notification pour le vendeur
      const { error: notifError } = await supabase.from("vendor_product_notifications").insert({
        vendor_id: product.seller_id,
        product_id: productId,
        notification_type: 'product_approved',
        title: "✅ Produit approuvé",
        message: `Félicitations ! Votre produit "${product.title}" a été approuvé et est maintenant visible sur la marketplace.`,
        priority: 'high',
        metadata: {
          product_id: productId,
          approved_at: new Date().toISOString()
        }
      });

      if (notifError) {
        console.error("❌ Erreur notification vendeur:", notifError);
      }

      toast({
        title: "✅ Produit approuvé",
        description: "Le vendeur a été notifié de l'approbation",
      });

      fetchPendingProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erreur approbation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le produit",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      toast({
        title: "⚠️ Raison requise",
        description: "Veuillez indiquer une raison de rejet",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingAction(true);
      const { error } = await supabase
        .from("marketplace_products")
        .update({
          moderation_status: "rejected",
          moderated_at: new Date().toISOString(),
          moderator_id: (await supabase.auth.getUser()).data.user?.id,
          status: "inactive",
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      // Créer notification pour le vendeur
      const { error: notifError } = await supabase.from("vendor_product_notifications").insert({
        vendor_id: selectedProduct.seller_id,
        product_id: selectedProduct.id,
        notification_type: 'product_rejected',
        title: "❌ Produit rejeté",
        message: `Votre produit "${selectedProduct.title}" a été rejeté. Raison: ${rejectionReason}`,
        priority: 'high',
        metadata: {
          product_id: selectedProduct.id,
          rejection_reason: rejectionReason
        }
      });

      if (notifError) {
        console.error("❌ Erreur notification vendeur:", notifError);
      }

      toast({
        title: "❌ Produit rejeté",
        description: "Le vendeur a été notifié",
      });

      fetchPendingProducts();
      setSelectedProduct(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Erreur rejet:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le produit",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getImageUrl = (images: any): string => {
    console.log('🖼️ [ProductModeration] getImageUrl input:', images, typeof images);
    
    if (!images) {
      console.warn('⚠️ No images provided, using placeholder');
      return "/placeholder.svg";
    }
    
    // Si c'est déjà un array
    if (Array.isArray(images)) {
      const firstImage = images[0];
      console.log('✅ Array detected, first image:', firstImage);
      return firstImage || "/placeholder.svg";
    }
    
    // Si c'est un JSONB string (possible avec Supabase)
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          console.log('✅ Parsed JSONB array, first image:', parsed[0]);
          return parsed[0] || "/placeholder.svg";
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse images string:', e);
      }
    }
    
    console.warn('⚠️ Unknown image format, using placeholder');
    return "/placeholder.svg";
  };

  if (loading) {
  // Mode édition
  if (editingProduct) {
    return (
      <EditProductForm
        product={editingProduct}
        onBack={() => setEditingProduct(null)}
        onUpdate={() => {
          setEditingProduct(null);
          fetchPendingProducts();
          toast({
            title: "✅ Produit modifié",
            description: "Le produit a été mis à jour avec succès",
          });
        }}
      />
    );
  }

  return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modération Produits</h1>
          <p className="text-muted-foreground">
            {products.length} produit{products.length !== 1 ? "s" : ""} en attente de validation
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Package className="h-4 w-4 mr-2" />
          {products.length}
        </Badge>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">Aucun produit en attente</p>
            <p className="text-muted-foreground">Tous les produits ont été modérés</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                  src={getImageUrl(product.images)}
                  alt={product.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(product.created_at).toLocaleDateString("fr-FR")}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {product.price.toLocaleString()} CDF
                  </span>
                  <Badge>{product.category}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{product.seller_name || "Vendeur inconnu"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{product.location || "Non spécifié"}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(product.id)}
                    disabled={processingAction}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowRejectDialog(true);
                    }}
                    disabled={processingAction}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog détails produit */}
      <Dialog open={!!selectedProduct && !showRejectDialog} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.title}</DialogTitle>
            <DialogDescription>
              Soumis le {selectedProduct && new Date(selectedProduct.created_at).toLocaleString("fr-FR")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {selectedProduct && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {Array.isArray(selectedProduct.images) &&
                    selectedProduct.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="rounded-lg object-cover aspect-square"
                      />
                    ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Prix</Label>
                      <p className="text-lg font-bold text-primary">
                        {selectedProduct.price.toLocaleString()} CDF
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Catégorie</Label>
                      <p className="text-sm">{selectedProduct.category}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Vendeur</Label>
                    <div className="text-sm space-y-1 mt-1">
                      <p>{selectedProduct.seller_name}</p>
                      <p className="text-muted-foreground">
                        {selectedProduct.seller_phone}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Localisation</Label>
                    <p className="text-sm">{selectedProduct.location}</p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Fermer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingProduct(selectedProduct);
                setSelectedProduct(null);
              }}
              disabled={processingAction}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier avant validation
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={processingAction}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              onClick={() => selectedProduct && handleApprove(selectedProduct.id)}
              disabled={processingAction}
            >
              {processingAction ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le produit</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet. Le vendeur sera notifié.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Raison du rejet *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: Images de mauvaise qualité, description incomplète..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingAction || !rejectionReason.trim()}
            >
              {processingAction ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
