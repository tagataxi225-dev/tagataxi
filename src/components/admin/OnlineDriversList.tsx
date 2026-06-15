import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Car, Star, Users, MapPin } from 'lucide-react'

interface OnlineDriver {
  user_id: string
  rating_average?: number
  total_rides: number
  service_type?: string
  last_ping: string
}

interface OnlineDriversListProps {
  drivers: OnlineDriver[]
  loading?: boolean
}

const getServiceTypeLabel = (type?: string) => {
  const typeMap: Record<string, string> = {
    'taxi': 'Taxi',
    'moto': 'Moto',
    'delivery': 'Livraison',
    'bus': 'Bus',
    'vtc': 'VTC'
  }
  return typeMap[type || 'taxi'] || 'Taxi'
}

const getServiceTypeColor = (type?: string) => {
  const colorMap: Record<string, string> = {
    'taxi': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'moto': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'delivery': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bus': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'vtc': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  }
  return colorMap[type || 'taxi'] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export const OnlineDriversList: React.FC<OnlineDriversListProps> = ({
  drivers,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Chauffeurs en ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Chauffeurs en ligne
            <Badge variant="secondary" className="ml-auto">
              0 en ligne
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm font-medium">Aucun chauffeur en ligne</p>
            <p className="text-xs">Les chauffeurs actifs apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Chauffeurs en ligne
          <Badge variant="secondary" className="ml-auto">
            {drivers.length} en ligne
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div key={driver.user_id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    D
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      Chauffeur {driver.user_id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 dark:text-green-400">En ligne</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {driver.rating_average && driver.rating_average > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{driver.rating_average.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Pas de note</span>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{driver.total_rides} courses</span>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getServiceTypeColor(driver.service_type)}`}
                >
                  {getServiceTypeLabel(driver.service_type)}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}