import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePartnerPrizeClaims } from '@/hooks/usePartnerPrizes';
import { CLAIM_STATUS_CONFIG } from '@/types/partner-prize';
import type { ClaimStatus } from '@/types/partner-prize';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PartnerPrizeClaimsTracker: React.FC = () => {
  const { claims, isLoading, updateClaimStatus, stats } = usePartnerPrizeClaims();
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleStatusUpdate = async (claimId: string, newStatus: ClaimStatus) => {
    await updateClaimStatus.mutateAsync({
      id: claimId,
      status: newStatus,
      tracking_number: trackingNumber || undefined,
      admin_notes: adminNotes || undefined
    });
    setTrackingNumber('');
    setAdminNotes('');
    setExpandedClaim(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Réclamations Cadeaux
        </h2>
        <p className="text-muted-foreground text-sm">
          Suivez et gérez les réclamations de prix partenaires
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                <p className="text-xs text-yellow-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
                <p className="text-xs text-blue-600">En traitement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.shipped}</p>
                <p className="text-xs text-purple-600">Expédiés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                <p className="text-xs text-green-600">Livrés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims list */}
      <div className="space-y-3">
        {claims.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune réclamation</p>
            </CardContent>
          </Card>
        ) : (
          claims.map((claim) => {
            const statusConfig = CLAIM_STATUS_CONFIG[claim.status];
            const isExpanded = expandedClaim === claim.id;
            
            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {claim.partner_prize?.name || 'Prix inconnu'}
                          </h3>
                          <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Gagné le {format(new Date(claim.claimed_at), 'd MMM yyyy', { locale: fr })}
                        </p>

                        {claim.delivery_address && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{claim.delivery_address}</span>
                          </div>
                        )}

                        {claim.delivery_phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{claim.delivery_phone}</span>
                          </div>
                        )}

                        {claim.tracking_number && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Tracking: </span>
                            <code className="bg-muted px-1 rounded">{claim.tracking_number}</code>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {claim.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'processing')}
                          >
                            Traiter
                          </Button>
                        )}
                        
                        {claim.status === 'processing' && (
                          <Button 
                            size="sm"
                            onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                          >
                            Expédier
                          </Button>
                        )}
                        
                        {claim.status === 'shipped' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(claim.id, 'delivered')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Livré
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded form for shipping */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t space-y-3"
                      >
                        <div>
                          <label className="text-sm font-medium">Numéro de suivi</label>
                          <Input
                            value={trackingNumber}
                            onChange={e => setTrackingNumber(e.target.value)}
                            placeholder="Ex: DHL-123456789"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Notes admin</label>
                          <Textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Notes internes..."
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'shipped')}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Confirmer expédition
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setExpandedClaim(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
