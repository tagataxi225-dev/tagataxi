import { Sparkles, Trophy, Info, Ticket } from 'lucide-react';
import '@/styles/lottery.css';
import '@/styles/kwenda-gratta.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KwendaGrattaDashboard } from './KwendaGrattaDashboard';
import { SuperLotteryDashboard } from './SuperLotteryDashboard';
import { useLottery } from '@/hooks/useLottery';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export interface LotteryDashboardProps {
  hideHeader?: boolean;
}

export const LotteryDashboard = ({ hideHeader = false }: LotteryDashboardProps) => {
  const { t } = useLanguage();
  const { loading, myWins } = useLottery();

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Navigation principale 2 onglets */}
      <Tabs defaultValue="gratta" className="flex-1 flex flex-col">
        {!hideHeader && (
          <div className="flex-shrink-0 bg-background/60 dark:bg-background/40 backdrop-blur-xl border-b border-border/50 px-3 py-2">
            <TabsList className="w-full h-12 p-1 bg-muted/50 dark:bg-muted/20 grid grid-cols-2 rounded-xl">
              <TabsTrigger 
                value="gratta" 
                className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(210,100%,50%)] data-[state=active]:via-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(0,80%,50%)] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <span className="mr-2">🎰</span>
                TAGA Gratta
                <span className="ml-1">🇨🇩</span>
              </TabsTrigger>
              <TabsTrigger 
                value="super" 
                className="text-sm font-medium data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Super Loterie
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {/* Tembea Gratta - Nouveau système de cartes à gratter congolais */}
          <TabsContent value="gratta" className="m-0 h-full">
            <KwendaGrattaDashboard hideHeader={true} />
          </TabsContent>

          {/* Super Loterie - Système existant */}
          <TabsContent value="super" className="p-3 m-0">
            <SuperLotteryDashboard />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
