import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MoreHorizontal, 
  Eye, 
  XCircle, 
  UserPlus, 
  CheckCircle,
  Package,
  MapPin,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Truck
} from 'lucide-react';
import { DeliveryProfile } from '@/hooks/useDeliveryManagement';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryDataTableProps {
  deliveries: DeliveryProfile[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCancel: (deliveryId: string, reason: string) => Promise<void>;
  onAssignDriver: (deliveryId: string, driverId: string) => Promise<void>;
  onMarkDelivered: (deliveryId: string) => Promise<void>;
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'secondary' },
    confirmed: { label: 'Confirmée', variant: 'default' },
    driver_assigned: { label: 'Livreur assigné', variant: 'default' },
    picked_up: { label: 'Récupérée', variant: 'default' },
    in_transit: { label: 'En transit', variant: 'default' },
    delivered: { label: 'Livrée', variant: 'outline' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
  };
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'flash': return <Zap className="h-4 w-4 text-amber-500" />;
    case 'flex': return <Clock className="h-4 w-4 text-blue-500" />;
    case 'maxicharge': return <Truck className="h-4 w-4 text-purple-500" />;
    default: return <Package className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'flash': return 'Flash';
    case 'flex': return 'Flex';
    case 'maxicharge': return 'Maxicharge';
    default: return type;
  }
};

export const DeliveryDataTable: React.FC<DeliveryDataTableProps> = ({
  deliveries,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onCancel,
  onAssignDriver,
  onMarkDelivered,
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryProfile | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelClick = (delivery: DeliveryProfile) => {
    setSelectedDelivery(delivery);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleViewDetails = (delivery: DeliveryProfile) => {
    setSelectedDelivery(delivery);
    setDetailsDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedDelivery && cancelReason.trim()) {
      await onCancel(selectedDelivery.id, cancelReason);
      setCancelDialogOpen(false);
      setSelectedDelivery(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="p-8 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          Chargement des livraisons...
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="p-8 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Aucune livraison trouvée
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs">
                    {delivery.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{delivery.sender_name}</span>
                      <span className="text-xs text-muted-foreground">{delivery.sender_phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{delivery.recipient_name}</span>
                      <span className="text-xs text-muted-foreground">{delivery.recipient_phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs max-w-[200px]">
                      <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{delivery.pickup_location}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{delivery.delivery_location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(delivery.delivery_type)}
                      <span className="text-sm">{getTypeLabel(delivery.delivery_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.driver_name ? (
                      <span className="text-sm">{delivery.driver_name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(delivery.actual_price || delivery.estimated_price).toLocaleString()} CDF
                  </TableCell>
                  <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(delivery.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(delivery)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {!['delivered', 'cancelled'].includes(delivery.status) && (
                          <>
                            <DropdownMenuSeparator />
                            {delivery.status !== 'delivered' && (
                              <DropdownMenuItem onClick={() => onMarkDelivered(delivery.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marquer livrée
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleCancelClick(delivery)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la livraison</DialogTitle>
            <DialogDescription>
              Indiquez la raison de l'annulation de la livraison #{selectedDelivery?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Raison de l'annulation</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Décrivez la raison de l'annulation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim()}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la livraison</DialogTitle>
            <DialogDescription>
              ID: {selectedDelivery?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Expéditeur</h4>
                <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                  <p className="font-medium">{selectedDelivery.sender_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedDelivery.sender_phone}
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-500" /> {selectedDelivery.pickup_location}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Destinataire</h4>
                <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                  <p className="font-medium">{selectedDelivery.recipient_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedDelivery.recipient_phone}
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-500" /> {selectedDelivery.delivery_location}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Informations</h4>
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="flex items-center gap-1">
                      {getTypeIcon(selectedDelivery.delivery_type)}
                      {getTypeLabel(selectedDelivery.delivery_type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    {getStatusBadge(selectedDelivery.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Prix</span>
                    <span className="font-medium">
                      {(selectedDelivery.actual_price || selectedDelivery.estimated_price).toLocaleString()} CDF
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Livreur</h4>
                <div className="p-3 bg-muted/30 rounded-lg">
                  {selectedDelivery.driver_name ? (
                    <div className="space-y-1">
                      <p className="font-medium">{selectedDelivery.driver_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedDelivery.driver_phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun livreur assigné</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
