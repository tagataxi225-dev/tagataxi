import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone, Apple } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InstallButtonProps {
  platform?: 'android' | 'ios' | 'web' | 'auto';
  variant?: 'default' | 'outline' | 'ghost' | 'hero';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const InstallButton = ({ 
  platform = 'auto',
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  showText = true
}: InstallButtonProps) => {
  const { canInstall, isInstalled, platform: detectedPlatform, install } = useInstallPrompt();
  const { toast } = useToast();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      toast({
        title: "✅ Installation réussie !",
        description: "Tembea Taxi a été ajouté à votre écran d'accueil.",
      });
    }
  };

  const targetPlatform = platform === 'auto' ? detectedPlatform : platform;

  // Ne pas afficher si déjà installé
  if (isInstalled && platform === 'auto') {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("cursor-default", className)}
        disabled
      >
        {showIcon && <Check className="w-4 h-4 mr-2 text-green-500" />}
        {showText && "Installée"}
      </Button>
    );
  }

  // iOS - Redirection vers page d'instructions
  if (targetPlatform === 'ios') {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => window.location.href = '/install'}
      >
        {showIcon && <Apple className="w-4 h-4 mr-2" />}
        {showText && "Installer sur iOS"}
      </Button>
    );
  }

  // Android/Desktop avec prompt natif
  if (canInstall || platform !== 'auto') {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("group", className)}
        onClick={handleInstall}
      >
        {showIcon && <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />}
        {showText && (targetPlatform === 'android' ? "Installer sur Android" : "Installer l'app")}
      </Button>
    );
  }

  // Fallback - Redirection vers /install
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => window.location.href = '/install'}
    >
      {showIcon && <Smartphone className="w-4 h-4 mr-2" />}
      {showText && "Installer l'app"}
    </Button>
  );
};
