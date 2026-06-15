import { cn } from "@/lib/utils";

interface StoreButtonsProps {
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=cd.kwenda.app";
const APP_STORE_URL = "https://apps.apple.com/ci/app/kwenda-taxi/id6759842295";

export const getDevicePlatform = (): 'ios' | 'android' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || (navigator as any).vendor || '';
  if (/iPad|iPhone|iPod|Macintosh/.test(ua) && 'ontouchend' in document) return 'ios';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
};

// Google Play Store Icon
const PlayStoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("w-5 h-5", className)} fill="currentColor">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
  </svg>
);

// Apple Icon
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("w-5 h-5", className)} fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base"
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6"
};

export const StoreButtons = ({ 
  layout = 'horizontal', 
  size = 'md',
  showLabels = true,
  className 
}: StoreButtonsProps) => {

  const stores = [
    { url: PLAY_STORE_URL, icon: PlayStoreIcon, topLabel: 'GET IT ON', label: 'Google Play' },
    { url: APP_STORE_URL, icon: AppleIcon, topLabel: 'Download on the', label: 'App Store' },
  ];

  return (
    <div className={cn(
      "flex gap-3",
      layout === 'vertical' && "flex-col",
      className
    )}>
      {stores.map((store) => (
        <a
          key={store.label}
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all hover:scale-105",
            sizeClasses[size]
          )}
        >
          <store.icon className={iconSizes[size]} />
          {showLabels && (
            <div className="text-left">
              <div className="text-[10px] opacity-80 leading-tight">{store.topLabel}</div>
              <div className="font-semibold leading-tight">{store.label}</div>
            </div>
          )}
        </a>
      ))}
    </div>
  );
};

export { PLAY_STORE_URL, APP_STORE_URL };
