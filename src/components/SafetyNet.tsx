/**
 * 🛡️ SAFETY NET - ERROR BOUNDARY GLOBAL
 * Affiche un écran statique en cas de crash, sans auto-recovery loop
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { healthMonitor } from '@/services/HealthMonitor';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  componentName: string;
}

export class SafetyNet extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    componentName: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentStack = errorInfo.componentStack || '';
    const componentName = this.extractComponentName(componentStack);

    // Log complet pour diagnostic
    console.error('💥 [SafetyNet] Crash détecté:', {
      component: componentName,
      error: error.message,
      stack: error.stack,
      componentStack,
    });

    healthMonitor.recordCrash(componentName);

    this.setState({ errorInfo, componentName });
  }

  private extractComponentName(stack: string): string {
    const lines = stack.split('\n');
    const firstLine = lines.find(line => line.trim().startsWith('at '));
    if (firstLine) {
      const match = firstLine.match(/at (\w+)/);
      return match ? match[1] : 'Unknown';
    }
    return 'Unknown';
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    localStorage.removeItem('kwenda_user_roles_cache');
    window.location.reload();
  };

  private handleGoHome = () => {
    const selectedRole = localStorage.getItem('kwenda_selected_role');
    const dashboardPath = selectedRole === 'driver' ? '/app/chauffeur'
      : selectedRole === 'partner' ? '/app/partenaire'
      : selectedRole === 'admin' ? '/operatorx/admin'
      : '/app/client';
    window.location.href = dashboardPath;
  };

  public render() {
    if (this.state.hasError) {
      const { error, componentName } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 space-y-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />

            <h1 className="text-2xl font-bold text-gray-900">Problème détecté</h1>

            <p className="text-gray-600">
              L'application a rencontré un problème. Vous pouvez réessayer ou redémarrer.
            </p>

            {/* Toujours afficher le message d'erreur pour diagnostic */}
            {error && (
              <div className="text-left text-sm space-y-2">
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="font-semibold text-red-800 text-xs mb-1">Erreur : {componentName}</p>
                  <p className="text-red-700 text-xs break-words">{error.message}</p>
                </div>
                <details className="bg-gray-50 p-3 rounded">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 text-xs">
                    Stack technique
                  </summary>
                  <pre className="mt-2 text-[10px] overflow-auto bg-white p-2 rounded border max-h-40">
                    {error.stack}
                  </pre>
                </details>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button onClick={this.handleRetry} className="w-full" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>

              <Button onClick={this.handleReload} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Redémarrer l'application
              </Button>

              <Button onClick={this.handleGoHome} className="w-full" variant="ghost">
                <Home className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Si le problème persiste, contactez le support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
