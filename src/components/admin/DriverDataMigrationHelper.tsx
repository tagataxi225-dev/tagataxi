import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Car,
  Loader2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const DriverDataMigrationHelper: React.FC = () => {
  const [migrating, setMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<{
    total: number
    migrated: number
    errors: string[]
  }>({ total: 0, migrated: 0, errors: [] })
  const [migrationComplete, setMigrationComplete] = useState(false)
  const { toast } = useToast()

  const migrateDriverData = async () => {
    setMigrating(true)
    setMigrationStatus({ total: 0, migrated: 0, errors: [] })

    try {
      // 1. Récupérer tous les chauffeurs existants
      const { data: drivers, error: driversError } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('is_active', true)

      if (driversError) throw driversError

      if (!drivers || drivers.length === 0) {
        toast({
          title: "Aucune donnée à migrer",
          description: "Tous les chauffeurs sont déjà configurés",
        })
        setMigrating(false)
        return
      }

      setMigrationStatus(prev => ({ ...prev, total: drivers.length }))

      // 2. Migrer chaque chauffeur
      for (const driver of drivers) {
        try {
          // Créer l'association véhicule si le chauffeur a des informations véhicule
          if (driver.vehicle_type && driver.vehicle_model) {
            const vehicleDetails = {
              make: driver.vehicle_model.split(' ')[0] || 'Inconnu',
              model: driver.vehicle_model,
              year: driver.vehicle_year || new Date().getFullYear(),
              plate: driver.vehicle_plate || 'NON-DÉFINIE',
              color: driver.vehicle_color,
              vehicle_class: 'standard',
              insurance_number: driver.insurance_number,
              insurance_expiry: driver.insurance_expiry
            }

            // Vérifier si l'association existe déjà
            const { data: existingAssociation } = await supabase
              .from('driver_vehicle_associations')
              .select('id')
              .eq('driver_id', driver.user_id)
              .single()

            if (!existingAssociation) {
              const { error: vehicleError } = await supabase
                .from('driver_vehicle_associations')
                .insert({
                  driver_id: driver.user_id,
                  association_type: 'own_vehicle',
                  vehicle_details: vehicleDetails,
                  is_primary: true,
                  is_active: true,
                  approval_status: driver.verification_status === 'verified' ? 'approved' : 'pending'
                })

              if (vehicleError) throw vehicleError
            }
          }

          // Créer les préférences de service
          const { data: existingPreferences } = await supabase
            .from('driver_service_preferences')
            .select('id')
            .eq('driver_id', driver.user_id)
            .single()

          if (!existingPreferences) {
            const serviceTypes = []
            if (driver.vehicle_type === 'taxi') serviceTypes.push('taxi')
            if (driver.delivery_capacity) serviceTypes.push('delivery')
            if (serviceTypes.length === 0) serviceTypes.push('taxi') // Par défaut

            const { error: preferencesError } = await supabase
              .from('driver_service_preferences')
              .insert({
                driver_id: driver.user_id,
                service_types: serviceTypes,
                preferred_zones: driver.service_areas || ['Kinshasa'],
                vehicle_classes: ['standard'],
                max_distance_km: 50,
                languages: ['fr'],
                is_active: true
              })

            if (preferencesError) throw preferencesError
          }

          setMigrationStatus(prev => ({ ...prev, migrated: prev.migrated + 1 }))

        } catch (error: any) {
          console.error(`Erreur migration chauffeur ${driver.user_id}:`, error)
          setMigrationStatus(prev => ({
            ...prev,
            errors: [...prev.errors, `${driver.display_name}: ${error.message}`]
          }))
        }
      }

      setMigrationComplete(true)
      toast({
        title: "Migration terminée",
        description: `${migrationStatus.migrated} chauffeurs migrés avec succès`,
      })

    } catch (error: any) {
      toast({
        title: "Erreur de migration",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Migration des données chauffeurs
        </CardTitle>
        <CardDescription>
          Migrer les anciens profils chauffeurs vers le nouveau système flexible
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cette opération va créer automatiquement les associations véhicules et préférences 
            de service pour tous les chauffeurs existants. Elle ne peut être exécutée qu'une seule fois.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Anciens profils chauffeurs</span>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              Table "chauffeurs"
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm">Migration vers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Associations véhicules</span>
              <Badge variant="secondary">
                <Car className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Préférences services</span>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            </div>
          </div>
        </div>

        {migrationStatus.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{migrationStatus.migrated}/{migrationStatus.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(migrationStatus.migrated / migrationStatus.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {migrationStatus.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Erreurs de migration :</p>
                {migrationStatus.errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs">{error}</p>
                ))}
                {migrationStatus.errors.length > 3 && (
                  <p className="text-xs">... et {migrationStatus.errors.length - 3} autres erreurs</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {migrationComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Migration terminée avec succès ! Les chauffeurs peuvent maintenant utiliser 
              le nouveau système de gestion des véhicules.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={migrateDriverData} 
          disabled={migrating || migrationComplete}
          className="w-full"
        >
          {migrating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Migration en cours...
            </>
          ) : migrationComplete ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Migration terminée
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Lancer la migration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}