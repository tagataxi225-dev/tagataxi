import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Safe theme access with fallback
  let theme = "dark";
  try {
    const themeData = useTheme();
    theme = themeData.theme || "dark";
  } catch (error) {
    // Fallback if theme context is not available
    theme = "dark";
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group !z-[9998]"
      position="top-center"
      offset={16}
      duration={2000}
      gap={8}
      visibleToasts={3}
      expand={false}
      style={{ 
        '--offset': 'max(env(safe-area-inset-top), 16px)',
        zIndex: 9998 
      } as React.CSSProperties}
      toastOptions={{
        duration: 2000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/10 group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          success:
            "group-[.toast]:bg-emerald-500/10 group-[.toast]:text-emerald-600 group-[.toast]:border-emerald-500/30",
          error:
            "group-[.toast]:bg-red-500/10 group-[.toast]:text-red-600 group-[.toast]:border-red-500/30",
          warning:
            "group-[.toast]:bg-amber-500/10 group-[.toast]:text-amber-600 group-[.toast]:border-amber-500/30",
          info:
            "group-[.toast]:bg-blue-500/10 group-[.toast]:text-blue-600 group-[.toast]:border-blue-500/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
