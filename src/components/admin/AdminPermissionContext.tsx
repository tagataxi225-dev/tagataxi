import React, { createContext, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Shield, Code, AlertTriangle } from 'lucide-react';

interface AdminPermissionContextType {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  showAllSections: boolean;
  setShowAllSections: (enabled: boolean) => void;
}

const AdminPermissionContext = createContext<AdminPermissionContextType | undefined>(undefined);

export const useAdminPermissions = () => {
  const context = useContext(AdminPermissionContext);
  if (!context) {
    throw new Error('useAdminPermissions must be used within AdminPermissionProvider');
  }
  return context;
};

interface AdminPermissionProviderProps {
  children: React.ReactNode;
}

export const AdminPermissionProvider: React.FC<AdminPermissionProviderProps> = ({ children }) => {
  const [devMode, setDevMode] = useState(window.location.hostname === 'localhost');
  const [showAllSections, setShowAllSections] = useState(false);

  return (
    <AdminPermissionContext.Provider value={{
      devMode,
      setDevMode,
      showAllSections,
      setShowAllSections
    }}>
      {children}
    </AdminPermissionContext.Provider>
  );
};

export const AdminPermissionSettings: React.FC = () => {
  const { devMode, setDevMode, showAllSections, setShowAllSections } = useAdminPermissions();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Configuration d'affichage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Mode développement</div>
              <div className="text-xs text-muted-foreground">
                Affiche les sections en développement
              </div>
            </div>
          </div>
          <Switch
            checked={devMode}
            onCheckedChange={setDevMode}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <div className="text-sm font-medium">Ignorer les permissions</div>
              <div className="text-xs text-muted-foreground">
                Affiche toutes les sections (développement uniquement)
              </div>
            </div>
          </div>
          <Switch
            checked={showAllSections}
            onCheckedChange={setShowAllSections}
          />
        </div>

        {showAllSections && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2 text-amber-700 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">
                Mode développement actif - Toutes les sections sont visibles
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};