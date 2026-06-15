import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AddressShortcutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const AddressShortcutButton: React.FC<AddressShortcutButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  showIcon = true
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/mes-adresses');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {showIcon && <MapPin className="h-4 w-4 mr-2" />}
      Mes adresses
    </Button>
  );
};