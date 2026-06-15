import { UserProfile } from './UserProfile';

interface ResponsiveUserProfileProps {
  userType?: 'client' | 'driver' | 'partner';
  onWalletAccess?: () => void;
  onViewChange?: (view: string) => void;
  onClose?: () => void;
}

export const ResponsiveUserProfile = ({ 
  userType = 'client', 
  onWalletAccess,
  onViewChange,
  onClose 
}: ResponsiveUserProfileProps) => {
  return (
    <UserProfile 
      onWalletAccess={onWalletAccess}
      onViewChange={onViewChange}
      onClose={onClose}
    />
  );
};
