import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Car, 
  Users, 
  Star, 
  Settings, 
  CheckCircle, 
  Clock, 
  XCircle,
  Edit,
  Trash2,
  Crown
} from 'lucide-react'
import { useDriverVehicleAssociations } from '@/hooks/useDriverVehicleAssociations'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FlexibleDriverRegistration } from '@/components/driver/registration/FlexibleDriverRegistration'

interface VehicleManagementPanelProps {
  driverId?: string
}

export const VehicleManagementPanel: React.FC<VehicleManagementPanelProps> = ({ driverId }) => {
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const {
    vehicleAssociations,
    servicePreferences,
    loading,
    setPrimaryVehicle,
    removeAssociation,
    getPrimaryVehicle,
    getAvailableServiceTypes
  } = useDriverVehicleAssociations()

  const primaryVehicle = getPrimaryVehicle()
  const serviceTypes = getAvailableServiceTypes()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive'
    } as const

    const labels = {
      approved: 'Approuvé',
      pending: 'En attente',
      rejected: 'Rejeté'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getAssociationTypeLabel = (type: string) => {
    switch (type) {
      case 'own_vehicle':
        return 'Véhicule personnel'
      case 'partner_vehicle':
        return 'Véhicule partenaire'
      default:
        return type
    }
  }

  const renderVehicleCard = (association: any) => {
    const isOwn = association.association_type === 'own_vehicle'
    const vehicleInfo = isOwn ? association.vehicle_details : null

    return (
      <Card key={association.id} className={`relative ${association.is_primary ? 'ring-2 ring-primary' : ''}`}>
        {association.is_primary && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-primary text-primary-foreground">
              <Crown className="h-3 w-3 mr-1" />
              Principal
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              <CardTitle className="text-lg">
                {isOwn 
                  ? `${vehicleInfo?.make || ''} ${vehicleInfo?.model || ''}`.trim() || 'Véhicule personnel'
                  : 'Véhicule partenaire'
                }
              </CardTitle>
            </div>
            {getStatusIcon(association.approval_status)}
          </div>
          <CardDescription>
            {getAssociationTypeLabel(association.association_type)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut:</span>
            {getStatusBadge(association.approval_status)}
          </div>

          {isOwn && vehicleInfo && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plaque:</span>
                <span className="font-medium">{vehicleInfo.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Année:</span>
                <span>{vehicleInfo.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe:</span>
                <span className="capitalize">{vehicleInfo.vehicle_class}</span>
              </div>
              {vehicleInfo.color && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Couleur:</span>
                  <span>{vehicleInfo.color}</span>
                </div>
              )}
            </div>
          )}

          {!isOwn && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partenaire:</span>
                <span>ID: {association.partner_id?.slice(0, 8)}...</span>
              </div>
            </div>
          )}

          {association.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{association.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!association.is_primary && association.approval_status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrimaryVehicle.mutate(association.id)}
                disabled={setPrimaryVehicle.isPending}
              >
                Définir principal
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeAssociation.mutate(association.id)}
              disabled={removeAssociation.isPending}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted" />
              <CardContent className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec informations de service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mes véhicules et services
          </CardTitle>
          <CardDescription>
            Gérez vos véhicules et préférences de service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Services proposés</h4>
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service === 'taxi' && <Users className="h-3 w-3 mr-1" />}
                    {service === 'delivery' && <Car className="h-3 w-3 mr-1" />}
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Zones préférées</h4>
              <div className="flex flex-wrap gap-2">
                {servicePreferences?.preferred_zones?.map((zone) => (
                  <Badge key={zone} variant="outline">
                    {zone}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des véhicules */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mes véhicules ({vehicleAssociations?.length || 0})</h3>
        
        <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter véhicule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un véhicule</DialogTitle>
              <DialogDescription>
                Configurez un nouveau véhicule ou associez-vous à un partenaire
              </DialogDescription>
            </DialogHeader>
            <FlexibleDriverRegistration 
              onComplete={() => {
                setShowAddVehicle(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {vehicleAssociations?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun véhicule configuré</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez votre premier véhicule pour commencer à recevoir des courses
            </p>
            <Button onClick={() => setShowAddVehicle(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un véhicule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicleAssociations?.map(renderVehicleCard)}
        </div>
      )}

      {/* Statistiques */}
      {vehicleAssociations && vehicleAssociations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Statistiques véhicules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {vehicleAssociations.filter(v => v.approval_status === 'approved').length}
                </div>
                <div className="text-sm text-muted-foreground">Approuvés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">
                  {vehicleAssociations.filter(v => v.approval_status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">En attente</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {vehicleAssociations.filter(v => v.association_type === 'own_vehicle').length}
                </div>
                <div className="text-sm text-muted-foreground">Personnels</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {vehicleAssociations.filter(v => v.association_type === 'partner_vehicle').length}
                </div>
                <div className="text-sm text-muted-foreground">Partenaires</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}