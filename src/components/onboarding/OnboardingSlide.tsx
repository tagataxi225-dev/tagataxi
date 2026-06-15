import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";

interface OnboardingSlideProps {
  icon: LucideIcon;
  title: string;
  tagline: string;
  benefits: string[];
  index: number;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  icon: Icon,
  title,
  tagline,
  benefits,
  index
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
      {/* Icône simple et élégante */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        {title}
      </motion.h2>

      {/* Tagline */}
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-base text-primary font-medium mb-6"
      >
        {tagline}
      </motion.p>

      {/* Benefits - Simple pills */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {benefits.map((benefit, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium text-foreground"
          >
            <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
            {benefit}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
