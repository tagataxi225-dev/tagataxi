import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Camera, 
  FileText, 
  Euro, 
  MapPin,
  Clock,
  AlertTriangle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeliveryValidationProps {
  orderId: string;
  orderDetails: {
    id: string;
    product_title: string;
    product_price: number;
    total_amount: number;
    seller_name: string;
    buyer_name: string;
    delivery_address: string;
    pickup_location: string;
    payment_method: 'cash' | 'mobile_money' | 'wallet';
    delivery_fee: number;
    notes?: string;
  };
  onValidationComplete: (success: boolean) => void;
}

const DeliveryValidationInterface: React.FC<DeliveryValidationProps> = ({
  orderId,
  orderDetails,
  onValidationComplete
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'pickup' | 'validate' | 'deliver' | 'payment'>('pickup');
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState({
    productCondition: '',
    productNotes: '',
    photoTaken: false,
    customerPresent: false,
    paymentReceived: false,
    cashAmount: 0,
    validationIssues: [] as string[]
  });

  const handlePickupConfirmation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_delivery_assignments')
        .update({
          assignment_status: 'picked_up',
          actual_pickup_time: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('driver_id', user?.id);

      if (error) throw error;

      setStep('validate');
      toast.success('Collecte confirmée');
    } catch (error: any) {
      console.error('Error confirming pickup:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleProductValidation = () => {
    if (!validationData.productCondition) {
      toast.error('Veuillez vérifier l\'état du produit');
      return;
    }

    setStep('deliver');
  };

  const handleDeliveryArrival = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_delivery_assignments')
        .update({
          assignment_status: 'at_destination',
          driver_notes: validationData.productNotes
        })
        .eq('order_id', orderId)
        .eq('driver_id', user?.id);

      if (error) throw error;

      setStep('payment');
      toast.success('Arrivé à destination');
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentValidation = async () => {
    if (orderDetails.payment_method === 'cash' && !validationData.paymentReceived) {
      toast.error('Veuillez confirmer la réception du paiement');
      return;
    }

    if (orderDetails.payment_method === 'cash' && validationData.cashAmount !== orderDetails.total_amount) {
      toast.error(`Montant incorrect. Attendu: ${orderDetails.total_amount.toLocaleString()} CDF`);
      return;
    }

    setLoading(true);
    try {
      // Complete delivery
      const { error: deliveryError } = await supabase
        .from('marketplace_delivery_assignments')
        .update({
          assignment_status: 'delivered',
          actual_delivery_time: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('driver_id', user?.id);

      if (deliveryError) throw deliveryError;

      // Update order status
      const { error: orderError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // If cash payment, record driver earning
      if (orderDetails.payment_method === 'cash') {
        const { error: walletError } = await supabase.functions.invoke('wallet-commission', {
          body: {
            driverId: user?.id,
            orderId: orderId,
            deliveryAmount: orderDetails.total_amount,
            deliveryFee: orderDetails.delivery_fee,
            paymentMethod: 'cash'
          }
        });

        if (walletError) {
          console.error('Wallet error:', walletError);
        }
      }

      toast.success('Livraison terminée avec succès !');
      onValidationComplete(true);

    } catch (error: any) {
      console.error('Error completing delivery:', error);
      toast.error('Erreur lors de la finalisation');
      onValidationComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const addValidationIssue = (issue: string) => {
    setValidationData(prev => ({
      ...prev,
      validationIssues: [...prev.validationIssues, issue]
    }));
  };

  const renderProgressBar = () => {
    const steps = ['pickup', 'validate', 'deliver', 'payment'];
    const currentIndex = steps.indexOf(step);

    return (
      <div className="flex items-center space-x-2 mb-6">
        {steps.map((s, index) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
              index <= currentIndex ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
            )}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-1 mx-2",
                index < currentIndex ? "bg-primary" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Validation de livraison marketplace
        </CardTitle>
        {renderProgressBar()}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Produit:</strong> {orderDetails.product_title}
              </div>
              <div>
                <strong>Prix:</strong> {orderDetails.total_amount.toLocaleString()} CDF
              </div>
              <div>
                <strong>Vendeur:</strong> {orderDetails.seller_name}
              </div>
              <div>
                <strong>Acheteur:</strong> {orderDetails.buyer_name}
              </div>
              <div className="col-span-2">
                <strong>Collecte:</strong> {orderDetails.pickup_location}
              </div>
              <div className="col-span-2">
                <strong>Livraison:</strong> {orderDetails.delivery_address}
              </div>
              <div>
                <strong>Commission:</strong> {orderDetails.delivery_fee.toLocaleString()} CDF
              </div>
              <div>
                <Badge 
                  variant={orderDetails.payment_method === 'cash' ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {orderDetails.payment_method === 'cash' ? 'Paiement à la livraison' : 'Prépayé'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {step === 'pickup' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Collecte chez le vendeur
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Confirmez que vous avez collecté le produit chez le vendeur et qu'il est conforme à la commande.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> Vérifiez l'état du produit avant de confirmer la collecte.
                    En cas de problème, contactez le support.
                  </div>
                </div>
              </div>
              <Button 
                onClick={handlePickupConfirmation}
                disabled={loading}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer la collecte
              </Button>
            </div>
          </div>
        )}

        {step === 'validate' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Validation du produit
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">État du produit</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={validationData.productCondition === 'excellent' ? 'default' : 'outline'}
                    onClick={() => setValidationData(prev => ({ ...prev, productCondition: 'excellent' }))}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Excellent
                  </Button>
                  <Button
                    variant={validationData.productCondition === 'damaged' ? 'destructive' : 'outline'}
                    onClick={() => setValidationData(prev => ({ ...prev, productCondition: 'damaged' }))}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Endommagé
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes de validation (optionnel)</label>
                <Textarea
                  placeholder="Décrivez l'état du produit, emballage, etc."
                  value={validationData.productNotes}
                  onChange={(e) => setValidationData(prev => ({ ...prev, productNotes: e.target.value }))}
                />
              </div>

              <Button
                onClick={() => setValidationData(prev => ({ ...prev, photoTaken: true }))}
                variant="outline"
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Prendre une photo (recommandé)
              </Button>

              <Button 
                onClick={handleProductValidation}
                disabled={!validationData.productCondition}
                className="w-full"
              >
                Continuer vers la livraison
              </Button>
            </div>
          </div>
        )}

        {step === 'deliver' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              En route vers le client
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Dirigez-vous vers l'adresse de livraison. Confirmez votre arrivée quand vous êtes sur place.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <div className="text-sm">
                  <strong>Adresse de livraison:</strong><br />
                  {orderDetails.delivery_address}
                </div>
              </div>
              <Button 
                onClick={handleDeliveryArrival}
                disabled={loading}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Confirmer l'arrivée chez le client
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-500" />
              Finalisation et paiement
            </h3>
            <div className="space-y-4">
              {orderDetails.payment_method === 'cash' ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <Euro className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <strong>Paiement à la livraison</strong><br />
                        Montant à encaisser: <strong>{orderDetails.total_amount.toLocaleString()} CDF</strong><br />
                        Votre commission: <strong>{orderDetails.delivery_fee.toLocaleString()} CDF</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Montant reçu (CDF)</label>
                    <Input
                      type="number"
                      placeholder={orderDetails.total_amount.toString()}
                      value={validationData.cashAmount || ''}
                      onChange={(e) => setValidationData(prev => ({ 
                        ...prev, 
                        cashAmount: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="payment-received"
                      checked={validationData.paymentReceived}
                      onChange={(e) => setValidationData(prev => ({ 
                        ...prev, 
                        paymentReceived: e.target.checked 
                      }))}
                    />
                    <label htmlFor="payment-received" className="text-sm">
                      J'ai reçu le paiement complet du client
                    </label>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <strong>Commande prépayée</strong><br />
                      Le client a déjà payé. Remettez simplement le produit.<br />
                      Votre commission: <strong>{orderDetails.delivery_fee.toLocaleString()} CDF</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="customer-present"
                  checked={validationData.customerPresent}
                  onChange={(e) => setValidationData(prev => ({ 
                    ...prev, 
                    customerPresent: e.target.checked 
                  }))}
                />
                <label htmlFor="customer-present" className="text-sm">
                  Le client est présent et a reçu sa commande
                </label>
              </div>

              <Button 
                onClick={handlePaymentValidation}
                disabled={
                  !validationData.customerPresent ||
                  (orderDetails.payment_method === 'cash' && !validationData.paymentReceived) ||
                  loading
                }
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finaliser la livraison
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryValidationInterface;