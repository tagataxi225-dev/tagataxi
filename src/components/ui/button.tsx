import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant hover:shadow-glow rounded-xl transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg rounded-xl transition-all duration-300",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md rounded-xl transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg rounded-xl transition-all duration-300",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200",
        hero: "bg-gradient-hero text-white hover:scale-105 shadow-glow hover:shadow-xl font-semibold rounded-xl transition-all duration-300",
        success: "bg-gradient-success text-white hover:scale-105 shadow-md hover:shadow-glow rounded-xl transition-all duration-300",
        soft: "bg-card border border-border shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all duration-300",
        congo: "btn-congo hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300",
        "congo-soft": "bg-congo-red/10 text-congo-red border border-congo-red/20 hover:bg-congo-red/20 hover:border-congo-red/30 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300",
        glass: "glass-button text-foreground hover:scale-[1.02] rounded-xl shadow-md hover:shadow-lg transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
