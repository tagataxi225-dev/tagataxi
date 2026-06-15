import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Pour les erreurs de hooks, afficher un message personnalisé (pas d'auto-reload = boucle infinie)
    if (error.message?.includes('hooks') || error.message?.includes('Rendered more')) {
      console.error('🔥 [ErrorBoundary] Hooks error detected:', error.message);
      return { 
        hasError: true, 
        error: new Error('Erreur de chargement des services. Veuillez recharger la page.'), 
        errorInfo: null 
      };
    }
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 [ErrorBoundary] Uncaught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    // Nettoyer le cache et recharger
    localStorage.removeItem('kwenda_user_roles_cache');
    window.location.reload();
  };

  private handleClearAndReload = () => {
    // Nettoyer tout le localStorage et recharger
    const keysToKeep = ['kwenda_theme', 'kwenda_language', 'kwenda_selected_role'];
    const storage: Record<string, string> = {};
    
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) storage[key] = value;
    });
    
    localStorage.clear();
    
    Object.entries(storage).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // 🛡️ Rediriger vers le dashboard approprié, pas vers '/'
    const selectedRole = storage['kwenda_selected_role'];
    const dashboardPath = selectedRole === 'driver' ? '/app/chauffeur'
      : selectedRole === 'partner' ? '/app/partenaire'
      : selectedRole === 'admin' ? '/operatorx/admin'
      : '/app/client';
    
    window.location.href = dashboardPath;
  };

  public render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('Authentication') || 
                          this.state.error?.message?.includes('session');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 space-y-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            
            <h1 className="text-2xl font-bold text-gray-900">
              {isAuthError ? 'Erreur de connexion' : 'Une erreur est survenue'}
            </h1>
            
            <p className="text-gray-600">
              {isAuthError 
                ? 'Votre session a expiré ou n\'est pas correctement initialisée.'
                : 'L\'application a rencontré un problème inattendu.'
              }
            </p>

            {this.state.error && (
              <details className="text-left text-sm bg-gray-50 p-3 rounded">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  Détails techniques
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-semibold">Message :</span>
                    <pre className="mt-1 text-xs overflow-auto bg-white p-2 rounded border">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <span className="font-semibold">Composant :</span>
                      <pre className="mt-1 text-xs overflow-auto bg-white p-2 rounded border max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-2 pt-2">
              <Button 
                onClick={this.handleReload} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger l'application
              </Button>
              
              {isAuthError && (
                <Button 
                  onClick={this.handleClearAndReload} 
                  className="w-full"
                  variant="outline"
                >
                  Nettoyer et redémarrer
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Si le problème persiste, contactez le support technique
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
