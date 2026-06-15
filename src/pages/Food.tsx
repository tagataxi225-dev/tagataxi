import { useNavigate } from 'react-router-dom';
import { FoodOrderInterface } from '@/components/food/FoodOrderInterface';
import { FoodServiceTransition } from '@/components/food/FoodServiceTransition';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

// ErrorBoundary local pour la page Food
class FoodErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🍔 [Food] Error caught:', error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">
              Service indisponible
            </h2>
            <p className="text-sm text-muted-foreground">
              Le service de commande de repas a rencontré un problème. Veuillez réessayer.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={this.props.onBack}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Food() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/app/client');
  };

  return (
    <div className="h-screen h-dvh flex flex-col overflow-hidden bg-background">
      <FoodErrorBoundary onBack={handleBack}>
        <FoodServiceTransition>
          <FoodOrderInterface 
            onBack={handleBack}
            onOrderComplete={(orderId) => {
              console.log('Order completed:', orderId);
            }}
          />
        </FoodServiceTransition>
      </FoodErrorBoundary>
      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
