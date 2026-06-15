import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerHandle
} from '@/components/ui/drawer';
import { Gift, Gamepad2, Ticket, Briefcase, Star, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface MoreServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceSelect: (service: string) => void;
}

export const MoreServicesSheet = ({ 
  isOpen, 
  onClose, 
  onServiceSelect 
}: MoreServicesSheetProps) => {
  const { t } = useLanguage();

  const additionalServices = [
    {
      id: 'lottery',
      name: t('home.services.lottery'),
      icon: Ticket,
      gradient: 'hsl(262, 83%, 58%), hsl(330, 81%, 60%), hsl(350, 89%, 60%)',
      shadowColor: 'hsla(262, 83%, 58%, 0.35)',
      comingSoon: false,
      popular: true
    },
    {
      id: 'gift_cards',
      name: t('home.services.gift_cards'),
      icon: Gift,
      gradient: 'hsl(350, 89%, 60%), hsl(330, 81%, 45%), hsl(0, 72%, 51%)',
      shadowColor: 'hsla(350, 89%, 60%, 0.35)',
      comingSoon: true
    },
    {
      id: 'job',
      name: t('home.services.job'),
      icon: Briefcase,
      gradient: 'hsl(220, 90%, 50%), hsl(260, 85%, 55%), hsl(280, 90%, 58%)',
      shadowColor: 'hsla(220, 90%, 50%, 0.35)',
      comingSoon: false,
      popular: true
    },
    {
      id: 'games',
      name: t('home.services.games'),
      icon: Gamepad2,
      gradient: 'hsl(280, 90%, 58%), hsl(260, 85%, 55%), hsl(240, 80%, 60%)',
      shadowColor: 'hsla(280, 90%, 58%, 0.35)',
      comingSoon: true
    }
  ];

  const handleServiceClick = (serviceId: string) => {
    onServiceSelect(serviceId);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHandle className="mt-3 mb-1" />
        
        <DrawerHeader className="pb-3 pt-1">
          <DrawerTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('home.services.more_services')}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground/50 text-center">
            Découvrez tous nos services
          </DrawerDescription>
        </DrawerHeader>

        <div 
          className="grid grid-cols-2 gap-3.5 px-5 pb-6" 
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {additionalServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileTap={!service.comingSoon ? { scale: 0.95 } : {}}
                transition={{ 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 22
                }}
                onClick={() => !service.comingSoon && handleServiceClick(service.id)}
                disabled={service.comingSoon}
                className={`group relative flex flex-col items-center justify-center gap-3.5 p-5 rounded-2xl border transition-all duration-200 min-h-[148px] overflow-hidden ${
                  service.comingSoon 
                    ? 'cursor-not-allowed opacity-60 border-border/20 bg-muted/30' 
                    : 'cursor-pointer border-border/40 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 active:scale-[0.97]'
                }`}
                style={!service.comingSoon ? {
                  boxShadow: `0 8px 32px -8px ${service.shadowColor}, 0 2px 8px -2px hsla(0,0%,0%,0.06)`
                } : undefined}
              >
                {/* Badge "Populaire" */}
                {!service.comingSoon && service.popular && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <div 
                      className="text-white text-[7px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide"
                      style={{ background: `linear-gradient(135deg, ${service.gradient})` }}
                    >
                      <Star className="w-2 h-2 fill-current" />
                      {t('home.popular_badge')}
                    </div>
                  </div>
                )}

                {/* Badge "Bientôt" */}
                {service.comingSoon && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <div className="bg-foreground/8 text-foreground/50 text-[7px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 tracking-wide">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Clock className="w-2 h-2" />
                      </motion.div>
                      {t('home.coming_soon_badge')}
                    </div>
                  </div>
                )}

                {/* Icon */}
                <motion.div 
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.1, type: "spring", stiffness: 300, damping: 20 }}
                  style={{ 
                    background: `linear-gradient(135deg, ${service.gradient})`,
                    boxShadow: `0 10px 24px -6px ${service.shadowColor}, 0 4px 12px -4px ${service.shadowColor}`
                  }}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={1.6} />
                </motion.div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-center text-foreground leading-tight">
                  {service.name}
                </h3>
              </motion.button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
