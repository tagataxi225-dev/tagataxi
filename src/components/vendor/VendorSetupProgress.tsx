import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ChevronDown, ChevronUp, User, Package, Shield, ShoppingCart, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SetupStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface VendorSetupProgressProps {
  onActionClick?: (action: string) => void;
}

export const VendorSetupProgress = ({ onActionClick }: VendorSetupProgressProps) => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      checkSetupProgress();
    }
  }, [user]);

  const checkSetupProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const hasProfile = !!(profile?.display_name);

      const { count: productsCount } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);

      const hasProducts = (productsCount || 0) > 0;

      const { count: approvedCount } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .in('moderation_status', ['approved', 'active']);

      const hasApprovedProducts = (approvedCount || 0) > 0;

      const { count: ordersCount } = await supabase
        .from('marketplace_orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);

      const hasOrders = (ordersCount || 0) > 0;

      const { data: subscription } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('vendor_id', user.id)
        .single();

      const hasSubscription = !!subscription;

      const setupSteps: SetupStep[] = [
        {
          id: 'profile',
          label: 'Profil',
          icon: User,
          description: 'Compléter le profil de la boutique',
          completed: hasProfile,
          action: () => onActionClick?.('profile')
        },
        {
          id: 'product',
          label: 'Produit',
          icon: Package,
          description: 'Ajouter au moins 1 produit',
          completed: hasProducts,
          action: () => onActionClick?.('add-product')
        },
        {
          id: 'approved',
          label: 'Validation',
          icon: Shield,
          description: 'Produit approuvé par modération',
          completed: hasApprovedProducts
        },
        {
          id: 'order',
          label: 'Vente',
          icon: ShoppingCart,
          description: 'Première commande reçue',
          completed: hasOrders
        },
        {
          id: 'subscription',
          label: 'Abonnement',
          icon: CreditCard,
          description: 'Choisir un plan',
          completed: hasSubscription,
          action: () => onActionClick?.('subscription')
        }
      ];

      setSteps(setupSteps);

      const completedCount = setupSteps.filter(s => s.completed).length;
      const progressPercent = (completedCount / setupSteps.length) * 100;
      setProgress(progressPercent);

      // Auto-expand si < 50% complété
      setIsExpanded(progressPercent < 50);

    } catch (error) {
      console.error('Error checking setup progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-16 bg-muted/60 rounded-lg animate-pulse" />
    );
  }

  const completedSteps = steps.filter(s => s.completed).length;
  const isComplete = completedSteps === steps.length;

  // Mode complété à 100%
  if (isComplete) {
    return (
      <Card className="p-3 bg-green-500/10 border-green-500/20">
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">🎉 Boutique entièrement configurée !</span>
        </div>
      </Card>
    );
  }

  // Mode compact (par défaut si > 50%)
  if (!isExpanded) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">Configuration</span>
              <Badge variant={progress >= 50 ? "default" : "secondary"} className="text-xs h-5">
                {completedSteps}/{steps.length}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Mode étendu (détails des étapes)
  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Configuration de la boutique</h3>
          <Badge variant="secondary" className="text-xs">
            {completedSteps}/{steps.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {Math.round(progress)}%
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      {/* Grille d'étapes - horizontal sur desktop, 2x3 sur mobile */}
      <TooltipProvider>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={step.action}
                    disabled={!step.action || step.completed}
                    className={`
                      p-3 rounded-lg border transition-all duration-200
                      ${step.completed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-muted/30 border-border hover:border-primary/50'}
                      ${step.action && !step.completed ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
                      ${!step.action && !step.completed ? 'opacity-60' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {step.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <StepIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className={`text-xs font-medium text-center ${
                        step.completed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{step.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Cliquez sur une étape pour continuer la configuration
      </p>
    </Card>
  );
};
