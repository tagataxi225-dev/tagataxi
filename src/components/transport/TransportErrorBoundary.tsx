import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TransportErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [TransportErrorBoundary] Error caught:', error, errorInfo);
    
    // Log détaillé pour debug
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full glassmorphism">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-2">Problème détecté</h2>
                <p className="text-muted-foreground text-sm">
                  L'application a rencontré un problème et tente de se rétablir.
                </p>
              </div>

              {this.state.error && (
                <details className="text-left text-xs bg-muted p-3 rounded-lg">
                  <summary className="cursor-pointer font-mono text-destructive mb-2 font-semibold">
                    Détails techniques
                  </summary>
                  <pre className="mt-2 overflow-auto text-[10px] leading-relaxed whitespace-pre-wrap">
                    {this.state.error?.toString()}
                    {'\n\n'}
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Si le problème persiste, contactez le support TAGA
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
