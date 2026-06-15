import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'xs': '375px',
				'3xl': '1600px',
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
				'touch': '44px', // Touch target minimum
			},
			fontFamily: {
				'montserrat': ['Montserrat', 'sans-serif'],
				'satisfy': ['Satisfy', 'cursive'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					light: 'hsl(var(--primary-light))'
				},
				// Congo Theme Colors - Variables complètes avec variants
				congo: {
					red: 'hsl(var(--congo-red))',
					'red-electric': 'hsl(var(--congo-red-electric))',
					'red-vibrant': 'hsl(var(--congo-red-vibrant))',
					'red-glow': 'hsl(var(--congo-red-glow))',
					yellow: 'hsl(var(--congo-yellow))',
					'yellow-electric': 'hsl(var(--congo-yellow-electric))',
					'yellow-vibrant': 'hsl(var(--congo-yellow-vibrant))',
					'yellow-glow': 'hsl(var(--congo-yellow-glow))',
					green: 'hsl(var(--congo-green))',
					'green-electric': 'hsl(var(--congo-green-electric))',
					'green-vibrant': 'hsl(var(--congo-green-vibrant))',
					'green-glow': 'hsl(var(--congo-green-glow))',
					blue: 'hsl(var(--congo-blue))',
					'blue-electric': 'hsl(var(--congo-blue-electric))',
					'blue-vibrant': 'hsl(var(--congo-blue-vibrant))',
					'blue-glow': 'hsl(var(--congo-blue-glow))'
				},
				// Semantic colors using Congo palette
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					light: 'hsl(var(--accent-light))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Congo flag colors from design system
				'congo-blue': 'hsl(var(--congo-blue))',
				'congo-red': 'hsl(var(--congo-red))',
				'congo-yellow': 'hsl(var(--congo-yellow))',
				'congo-green': 'hsl(var(--congo-green))',
				
				// Congo electric variants
				'congo-red-electric': 'hsl(var(--congo-red-electric))',
				'congo-yellow-electric': 'hsl(var(--congo-yellow-electric))',
				'congo-green-electric': 'hsl(var(--congo-green-electric))',
				'congo-blue-electric': 'hsl(var(--congo-blue-electric))',
				
				// Congo vibrant variants
				'congo-red-vibrant': 'hsl(var(--congo-red-vibrant))',
				'congo-yellow-vibrant': 'hsl(var(--congo-yellow-vibrant))',
				'congo-green-vibrant': 'hsl(var(--congo-green-vibrant))',
				'congo-blue-vibrant': 'hsl(var(--congo-blue-vibrant))',
				
				// Congo glow variants
				'congo-red-glow': 'hsl(var(--congo-red-glow))',
				'congo-yellow-glow': 'hsl(var(--congo-yellow-glow))',
				'congo-green-glow': 'hsl(var(--congo-green-glow))',
				'congo-blue-glow': 'hsl(var(--congo-blue-glow))',

				grey: {
					50: 'hsl(var(--grey-50))',
					100: 'hsl(var(--grey-100))',
					200: 'hsl(var(--grey-200))',
					300: 'hsl(var(--grey-300))',
					400: 'hsl(var(--grey-400))',
					500: 'hsl(var(--grey-500))',
					600: 'hsl(var(--grey-600))',
					700: 'hsl(var(--grey-700))',
					800: 'hsl(var(--grey-800))',
					900: 'hsl(var(--grey-900))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				DEFAULT: 'var(--radius)',
				md: 'var(--radius)',
				sm: 'var(--radius-sm)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-congo-flag': 'var(--gradient-congo-flag)',
				'gradient-congo-modern': 'var(--gradient-congo-modern)',
				'gradient-congo-subtle': 'var(--gradient-congo-subtle)'
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'elegant': 'var(--shadow-elegant)',
				'glow': 'var(--shadow-glow)',
				'float': 'var(--shadow-float)',
				'food-card': '0 10px 40px -10px rgba(255, 99, 71, 0.3)',
				'food-hover': '0 20px 60px -15px rgba(255, 99, 71, 0.5)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'fast': 'var(--transition-fast)',
				'bounce': 'var(--transition-bounce)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'fade-up': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(8px)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0)' 
					}
				},
				'scale-fade': {
					'0%': { 
						opacity: '0', 
						transform: 'scale(0.98)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'scale(1)' 
					}
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' 
					},
					'50%': { 
						boxShadow: '0 0 40px hsl(var(--primary) / 0.6), 0 0 60px hsl(var(--primary) / 0.4)' 
					}
				},
				'congo-gradient': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'congo-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(var(--congo-red) / 0.3), 0 0 40px hsl(var(--congo-yellow) / 0.2)' 
					},
					'50%': { 
						boxShadow: '0 0 40px hsl(var(--congo-red) / 0.5), 0 0 60px hsl(var(--congo-yellow) / 0.4)' 
					}
				},
				'shimmer': {
					'0%, 100%': { 
						opacity: '1',
						filter: 'brightness(1) drop-shadow(0 0 10px rgba(220, 38, 38, 0.5))'
					},
					'50%': { 
						opacity: '0.85',
						filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(220, 38, 38, 0.8))'
					}
				},
				'ripple': {
					'0%': { 
						transform: 'scale(0)',
						opacity: '0.8'
					},
					'100%': { 
						transform: 'scale(4)',
						opacity: '0'
					}
				},
				'bounce-subtle': {
					'0%, 100%': { 
						transform: 'translateY(0)'
					},
					'50%': { 
						transform: 'translateY(-5px)'
					}
				},
				'pulse-soft': {
					'0%, 100%': { 
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.8',
						transform: 'scale(1.05)'
					}
				},
				'slide-in-up': {
					'0%': { 
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': { 
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'fade-in': {
					'0%': { 
						opacity: '0'
					},
					'100%': { 
						opacity: '1'
					}
				},
				'pulse-slow': {
					'0%, 100%': { 
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.85',
						transform: 'scale(1.05)'
					}
				},
				'slide-out-left': {
					'0%': { 
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': { 
						transform: 'translateX(-100%)',
						opacity: '0'
					}
				},
				'slide-in-right': {
					'0%': { 
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': { 
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'steam': {
					'0%, 100%': { 
						transform: 'translateY(0) scaleX(1)', 
						opacity: '0.3' 
					},
					'50%': { 
						transform: 'translateY(-20px) scaleX(1.5)', 
						opacity: '0.8' 
					}
				},
				'food-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 0 0 rgba(255, 99, 71, 0.7)' 
					},
					'50%': { 
						boxShadow: '0 0 0 10px rgba(255, 99, 71, 0)' 
					}
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.9' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shimmer': 'shimmer 3s linear infinite',
				'float': 'float 3s ease-in-out infinite',
				'fade-up': 'fade-up 0.3s ease-out',
				'scale-fade': 'scale-fade 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'congo-gradient': 'congo-gradient 4s ease-in-out infinite',
				'congo-pulse': 'congo-pulse 3s ease-in-out infinite',
				'congo-wave': 'congo-wave 6s ease-in-out infinite',
				'shimmer': 'shimmer 3s ease-in-out infinite',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
				'ripple': 'ripple 0.6s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'slide-in-up': 'slide-in-up 0.4s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'slide-out-left': 'slide-out-left 0.3s ease-out forwards',
				'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
				'steam': 'steam 2s ease-in-out infinite',
				'food-pulse': 'food-pulse 2s infinite',
				'shake': 'shake 0.5s ease-in-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
