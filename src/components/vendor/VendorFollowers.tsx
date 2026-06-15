import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVendorFollowersList } from '@/hooks/useVendorFollowersList';
import { Users, UserPlus, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const VendorFollowers = () => {
  const { followers, loading, totalFollowers, error } = useVendorFollowersList();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted/60 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-16 w-full bg-muted/60 rounded animate-pulse" />
          </CardContent>
        </Card>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-muted/60 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mes clients fidèles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-primary">{totalFollowers}</p>
              <p className="text-sm text-muted-foreground">
                {totalFollowers > 1 ? 'Followers' : 'Follower'}
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-full">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Programme de fidélité</p>
              <p>Les clients peuvent suivre votre boutique pour recevoir des notifications sur vos nouveaux produits et promotions.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Followers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Liste des followers ({totalFollowers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun follower pour le moment</p>
              <p className="text-sm mt-2">Partagez votre boutique pour attirer des clients !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map((followerData) => {
                const follower = followerData.follower;
                
                return (
                  <div
                    key={followerData.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={follower?.profile_photo_url} />
                      <AvatarFallback>
                        {follower?.display_name?.substring(0, 2).toUpperCase() || 
                         follower?.phone?.substring(0, 2) || 'CL'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {follower?.display_name || 'Client'}
                      </p>
                      {follower?.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {follower.phone}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <Badge variant="secondary">
                        Follower
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Depuis {formatDistanceToNow(new Date(followerData.created_at), {
                          addSuffix: false,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
