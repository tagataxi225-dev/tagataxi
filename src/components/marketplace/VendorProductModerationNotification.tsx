import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { VendorNotification, VendorNotificationType } from "@/hooks/useVendorNotifications";

interface VendorProductModerationNotificationProps {
  notification: VendorNotification;
  onMarkAsRead: (id: string) => void;
}

export const VendorProductModerationNotification = ({
  notification,
  onMarkAsRead,
}: VendorProductModerationNotificationProps) => {
  const navigate = useNavigate();
  const data = notification.data || notification.metadata || {};
  const notifType: VendorNotificationType = notification.type || notification.notification_type;
  
  const getIcon = () => {
    switch (notifType) {
      case 'product_approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'product_rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'product_flagged':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = () => {
    switch (notifType) {
      case 'product_approved':
        return 'default' as const;
      case 'product_rejected':
        return 'destructive' as const;
      case 'product_flagged':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleViewProduct = () => {
    if (data.product_id) {
      navigate(`/marketplace/vendor/products`);
      onMarkAsRead(notification.id);
    }
  };

  const handleEditProduct = () => {
    if (data.product_id) {
      navigate(`/marketplace/vendor/products?edit=${data.product_id}`);
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div className="flex gap-3 p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-semibold text-sm">{notification.title}</p>
            {data.product_title && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.product_title}
              </p>
            )}
          </div>
          <Badge variant={getBadgeVariant()} className="text-xs">
            {notifType.replace('_', ' ')}
          </Badge>
        </div>

        {data.product_image && (
          <img 
            src={data.product_image} 
            alt={data.product_title || 'Product'} 
            className="w-full h-24 object-cover rounded-md"
          />
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {data.rejection_reason && notifType === 'product_rejected' && (
          <div className="p-2 bg-destructive/10 rounded-md">
            <p className="text-xs font-medium text-destructive">
              Raison du rejet:
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              {data.rejection_reason}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewProduct}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir le produit
          </Button>
          
          {notifType === 'product_rejected' && (
            <Button
              size="sm"
              variant="default"
              onClick={handleEditProduct}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Éditer maintenant
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {new Date(notification.created_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};
