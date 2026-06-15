import { useState } from 'react';
import { UserRole } from '@/types/roles';

const SELECTED_ROLE_KEY = 'kwenda_selected_role';

/**
 * Hook pour gérer le rôle sélectionné par l'utilisateur
 * Lecture localStorage uniquement — aucun appel réseau au montage
 */
export const useSelectedRole = () => {
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(() => {
    return (localStorage.getItem(SELECTED_ROLE_KEY) as UserRole | null);
  });

  const setSelectedRole = (role: UserRole | null) => {
    if (role) {
      localStorage.setItem(SELECTED_ROLE_KEY, role);
    } else {
      localStorage.removeItem(SELECTED_ROLE_KEY);
    }
    setSelectedRoleState(role);
  };

  const clearSelectedRole = () => {
    localStorage.removeItem(SELECTED_ROLE_KEY);
    setSelectedRoleState(null);
  };

  const hasSelectedRole = (): boolean => {
    return !!localStorage.getItem(SELECTED_ROLE_KEY);
  };

  return {
    selectedRole,
    setSelectedRole,
    clearSelectedRole,
    hasSelectedRole
  };
};
