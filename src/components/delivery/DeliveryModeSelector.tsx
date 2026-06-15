import { useLanguage } from '@/contexts/LanguageContext';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';

export type DeliveryMode = 'flash' | 'cargo' | 'flex' | 'maxicharge';

interface DeliveryModeSelectorProps {
  selectedMode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
}

const DeliveryModeSelector = ({ selectedMode, onModeChange }: DeliveryModeSelectorProps) => {
  const { t } = useLanguage();

  const modes: { id: DeliveryMode; label: string }[] = [
    { id: 'flash', label: t('delivery.mode.flash') },
    { id: 'flex', label: t('delivery.mode.flex') },
    { id: 'maxicharge', label: t('delivery.mode.maxicharge') },
  ];

  return (
    <div className="px-4 py-3 bg-card border-b border-border">
      <div className="flex bg-muted/50 rounded-xl p-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
              selectedMode === mode.id
                ? 'bg-card shadow-sm text-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            <img 
              src={getVehicle3dIcon(mode.id)} 
              alt={mode.label}
              className="w-6 h-6 object-contain"
              draggable={false}
            />
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DeliveryModeSelector;
