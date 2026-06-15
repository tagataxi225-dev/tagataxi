import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, DollarSign, Users, UserPlus, ShoppingBag, Truck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  amount?: number
}

interface RealTimeActivityFeedProps {
  activities: ActivityLog[]
  loading?: boolean
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_registration':
    case 'driver_registration':
      return <UserPlus className="h-4 w-4" />
    case 'payment':
    case 'wallet_topup':
      return <DollarSign className="h-4 w-4" />
    case 'marketplace_purchase':
    case 'marketplace_sale':
      return <ShoppingBag className="h-4 w-4" />
    case 'delivery_completed':
    case 'ride_completed':
      return <Truck className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'user_registration':
    case 'driver_registration':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'payment':
    case 'wallet_topup':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'marketplace_purchase':
    case 'marketplace_sale':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'delivery_completed':
    case 'ride_completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const formatActivityType = (type: string) => {
  const typeMap: Record<string, string> = {
    'user_registration': 'Inscription utilisateur',
    'driver_registration': 'Inscription chauffeur',
    'payment': 'Paiement',
    'wallet_topup': 'Rechargement portefeuille',
    'marketplace_purchase': 'Achat marketplace',
    'marketplace_sale': 'Vente marketplace',
    'delivery_completed': 'Livraison terminée',
    'ride_completed': 'Course terminée',
    'account_deletion': 'Suppression compte'
  }
  return typeMap[type] || type
}

export const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({
  activities,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité en temps réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité en temps réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm font-medium">Aucune activité récente</p>
            <p className="text-xs">L'activité apparaîtra ici en temps réel</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activité en temps réel
          <Badge variant="secondary" className="ml-auto">
            {activities.length} événements
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {formatActivityType(activity.activity_type)}
                    </Badge>
                    {activity.amount && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.amount.toLocaleString()} CDF
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}