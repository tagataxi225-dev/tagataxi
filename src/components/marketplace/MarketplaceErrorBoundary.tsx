import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MarketplaceErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('💥 [ErrorBoundary] Marketplace crashed:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 [ErrorBoundary] Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oups ! Une erreur s'est produite</h1>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            La marketplace a rencontré un problème. Essayez de recharger la page.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Retour à l'accueil
            </Button>
          </div>
          {this.state.error && (
            <details className="mt-6 p-4 bg-muted rounded-lg max-w-2xl">
              <summary className="cursor-pointer font-mono text-sm">
                Détails techniques
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
