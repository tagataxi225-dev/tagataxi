import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

interface VehicleDetails {
  make: string
  model: string
  year: number
  plate: string
  color?: string
  vehicle_class: string
  license_number?: string
  insurance_number?: string
  insurance_expiry?: string
  [key: string]: any
}

interface DriverVehicleAssociation {
  id: string
  driver_id: string
  vehicle_id?: string
  partner_id?: string
  association_type: 'own_vehicle' | 'partner_vehicle'
  vehicle_details?: any
  is_active: boolean
  is_primary: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

interface ServicePreferences {
  service_types: string[]
  preferred_zones: string[]
  vehicle_classes: string[]
  max_distance_km?: number
  work_schedule?: any
  special_services?: string[]
  languages: string[]
}

export const useDriverVehicleAssociations = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer les associations de véhicules du chauffeur
  const { data: vehicleAssociations, isLoading: associationsLoading } = useQuery({
    queryKey: ['driver-vehicle-associations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_vehicle_associations')
        .select('*')
        .eq('is_active', true)
        .order('is_primary', { ascending: false })

      if (error) throw error
      return data as DriverVehicleAssociation[]
    }
  })

  // Récupérer les préférences de service
  const { data: servicePreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['driver-service-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_service_preferences')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as ServicePreferences | null
    }
  })

  // Créer une association véhicule propre
  const createOwnVehicleAssociation = useMutation({
    mutationFn: async (vehicleDetails: VehicleDetails) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase
        .from('driver_vehicle_associations')
        .insert({
          driver_id: user.user.id,
          association_type: 'own_vehicle',
          vehicle_details: vehicleDetails as any,
          is_primary: !vehicleAssociations?.length, // Premier véhicule = principal
          approval_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-vehicle-associations'] })
      toast({
        title: "Véhicule ajouté",
        description: "Votre véhicule a été ajouté et est en attente d'approbation",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Créer une association véhicule partenaire
  const createPartnerVehicleAssociation = useMutation({
    mutationFn: async ({ partnerId, vehicleId }: { partnerId: string, vehicleId?: string }) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase
        .from('driver_vehicle_associations')
        .insert({
          driver_id: user.user.id,
          association_type: 'partner_vehicle',
          partner_id: partnerId,
          vehicle_id: vehicleId,
          is_primary: !vehicleAssociations?.length,
          approval_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-vehicle-associations'] })
      toast({
        title: "Association créée",
        description: "Votre demande d'association avec le partenaire a été envoyée",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Mettre à jour les préférences de service
  const updateServicePreferences = useMutation({
    mutationFn: async (preferences: Partial<ServicePreferences>) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id) throw new Error('Utilisateur non connecté')

      const { data: existing } = await supabase
        .from('driver_service_preferences')
        .select('id')
        .eq('driver_id', user.user.id)
        .eq('is_active', true)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('driver_service_preferences')
          .update(preferences)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('driver_service_preferences')
          .insert({
            driver_id: user.user.id,
            ...preferences
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-service-preferences'] })
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences de service ont été sauvegardées",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Définir véhicule principal
  const setPrimaryVehicle = useMutation({
    mutationFn: async (associationId: string) => {
      const { data, error } = await supabase
        .from('driver_vehicle_associations')
        .update({ is_primary: true })
        .eq('id', associationId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-vehicle-associations'] })
      toast({
        title: "Véhicule principal défini",
        description: "Ce véhicule est maintenant votre véhicule principal",
      })
    }
  })

  // Supprimer une association
  const removeAssociation = useMutation({
    mutationFn: async (associationId: string) => {
      const { error } = await supabase
        .from('driver_vehicle_associations')
        .update({ is_active: false })
        .eq('id', associationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-vehicle-associations'] })
      toast({
        title: "Association supprimée",
        description: "L'association avec ce véhicule a été supprimée",
      })
    }
  })

  const getPrimaryVehicle = useCallback(() => {
    return vehicleAssociations?.find(assoc => assoc.is_primary && assoc.is_active)
  }, [vehicleAssociations])

  const getAvailableServiceTypes = useCallback(() => {
    return servicePreferences?.service_types || ['taxi']
  }, [servicePreferences])

  return {
    vehicleAssociations,
    servicePreferences,
    loading: associationsLoading || preferencesLoading || loading,
    createOwnVehicleAssociation,
    createPartnerVehicleAssociation,
    updateServicePreferences,
    setPrimaryVehicle,
    removeAssociation,
    getPrimaryVehicle,
    getAvailableServiceTypes
  }
}