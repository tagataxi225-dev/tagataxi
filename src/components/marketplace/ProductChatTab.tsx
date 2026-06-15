import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Package, DollarSign, MapPin } from 'lucide-react';

interface ProductChatTabProps {
  productId: string;
  sellerId: string;
  productTitle: string;
  sellerName?: string;
  sellerAvatar?: string;
  onClose?: () => void;
}

export const ProductChatTab: React.FC<ProductChatTabProps> = ({
  productId,
  sellerId,
  productTitle,
  sellerName = 'Vendeur',
  sellerAvatar,
  onClose
}) => {
  const quickActions = [
    { 
      label: "📦 Disponible ?", 
      message: "Bonjour, est-ce que ce produit est encore disponible ?",
      icon: Package
    },
    { 
      label: "💰 Prix négociable ?", 
      message: "Bonjour, le prix est-il négociable ?",
      icon: DollarSign
    },
    { 
      label: "📍 Lieu de retrait ?", 
      message: "Bonjour, où puis-je récupérer ce produit ?",
      icon: MapPin
    }
  ];

  return (
    <div className="h-full overflow-hidden">
      <UniversalChatInterface
        contextType="marketplace"
        contextId={productId}
        participantId={sellerId}
        title={`Chat - ${productTitle}`}
        isFloating={false}
        hideHeader={true}
        quickActions={quickActions.map(qa => ({
          label: qa.label,
          icon: qa.icon,
          action: () => {} // Placeholder - actual sending handled by onQuickActionMessage
        }))}
        onQuickActionMessage={(label) => {
          const qa = quickActions.find(q => q.label === label);
          return qa?.message || '';
        }}
      />
    </div>
  );
};
