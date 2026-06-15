import React from 'react';
import { motion } from 'framer-motion';
import { Download, MousePointer, Sparkles } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: Download,
      title: 'Télécharger',
      description: 'Installe l\'app en 30 secondes',
      duration: '30 sec'
    },
    {
      number: '02',
      icon: MousePointer,
      title: 'Commander',
      description: 'Choisis ton service en 2 clics',
      duration: '2 clics'
    },
    {
      number: '03',
      icon: Sparkles,
      title: 'Profiter',
      description: 'Reçois tes bonus immédiatement',
      duration: 'Immédiat'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-muted-foreground">
            3 étapes simples pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-8 text-center border border-border hover:shadow-lg transition-all hover:scale-105">
                {/* Step number */}
                <div className="text-6xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                
                {/* Description */}
                <p className="text-muted-foreground mb-3">{step.description}</p>
                
                {/* Duration badge */}
                <div className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                  {step.duration}
                </div>
              </div>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
