import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Printer, 
  Share2, 
  CheckCircle, 
  Camera, 
  User, 
  Clock,
  MapPin,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryProof {
  orderId: string;
  deliveryPhoto: string;
  recipientName: string;
  recipientSignature?: string;
  deliveredAt: string;
  deliveryLocation: string;
  driverName: string;
  packageDescription?: string;
  notes?: string;
}

interface DeliveryProofViewerProps {
  isOpen: boolean;
  onClose: () => void;
  proof: DeliveryProof;
}

export default function DeliveryProofViewer({ 
  isOpen, 
  onClose, 
  proof 
}: DeliveryProofViewerProps) {
  const { toast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);

  const formatDeliveryTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const handleDownload = async () => {
    try {
      // Generate a PDF or download the image
      const link = document.createElement('a');
      link.href = proof.deliveryPhoto;
      link.download = `proof-delivery-${proof.orderId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Téléchargement démarré",
        description: "La preuve de livraison est en cours de téléchargement"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la preuve de livraison",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Preuve de livraison - Commande #${proof.orderId.slice(-8)}`,
          text: `Livraison confirmée le ${formatDeliveryTime(proof.deliveredAt).date}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de la preuve de livraison a été copié"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const deliveryTime = formatDeliveryTime(proof.deliveredAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Preuve de livraison
            <Badge variant="outline">#{proof.orderId.slice(-8)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>

          {/* Delivery confirmation header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Livraison confirmée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{deliveryTime.date}</p>
                      <p className="text-sm text-muted-foreground">à {deliveryTime.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Reçu par</p>
                      <p className="text-sm text-muted-foreground">{proof.recipientName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Lieu de livraison</p>
                      <p className="text-sm text-muted-foreground">{proof.deliveryLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Livré par</p>
                      <p className="text-sm text-muted-foreground">{proof.driverName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo proof */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo de preuve de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <img
                  src={proof.deliveryPhoto}
                  alt="Preuve de livraison"
                  className="w-full h-auto max-h-96 object-contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Photo prise lors de la livraison le {deliveryTime.date} à {deliveryTime.time}
              </p>
            </CardContent>
          </Card>

          {/* Package details */}
          {proof.packageDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Détails du colis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{proof.packageDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Delivery notes */}
          {proof.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{proof.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Signature section */}
          {proof.recipientSignature && (
            <Card>
              <CardHeader>
                <CardTitle>Signature du destinataire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={proof.recipientSignature}
                    alt="Signature du destinataire"
                    className="max-h-32 w-auto mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Signature électronique de {proof.recipientName}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Certificate footer */}
          <div className="border-t pt-4 text-center text-sm text-muted-foreground">
            <p>Ce document certifie la livraison du colis</p>
            <p>Commande #{proof.orderId} • TAGA Delivery</p>
            <p>Généré le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}