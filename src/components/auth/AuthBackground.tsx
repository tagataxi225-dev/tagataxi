import { motion } from 'framer-motion';

/**
 * Premium animated background for authentication pages
 * Features: Mesh gradient, floating orbs, grid pattern
 */
export const AuthBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60 dark:opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-emerald-200/30 via-emerald-100/10 to-transparent dark:from-emerald-900/20 dark:via-emerald-900/5 dark:to-transparent blur-2xl" />
    </div>
  );
};
