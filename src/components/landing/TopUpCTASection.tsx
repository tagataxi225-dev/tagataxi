import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Smartphone, CheckCircle2, TrendingUp } from 'lucide-react';
import { ModernTopUpModal } from '@/components/wallet/ModernTopUpModal';
import { useNavigate } from 'react-router-dom';

export const TopUpCTASection = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6]);

  const stats = [
    { label: 'Transactions', value: '3M+', icon: TrendingUp },
    { label: 'Utilisateurs', value: '50K+', icon: CheckCircle2 },
    { label: 'Disponibilité', value: '99.9%', icon: Zap }
  ];

  const steps = [
    {
      number: '01',
      title: 'Choisissez le montant',
      description: 'Sélectionnez parmi nos montants rapides ou entrez votre montant personnalisé'
    },
    {
      number: '02',
      title: 'Sélectionnez l\'opérateur',
      description: 'Airtel, Orange ou M-Pesa - Compatible avec tous les opérateurs mobiles'
    },
    {
      number: '03',
      title: 'Confirmez et payez',
      description: 'Votre compte est crédité instantanément et sécurisé'
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated background */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{ y, opacity }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Zap className="mr-1 h-3 w-3" />
            Recharge instantanée
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Rechargez votre compte en 30 secondes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une expérience de paiement mobile simple, rapide et sécurisée. 
            Compatible avec tous les opérateurs du Congo.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 text-center"
            >
              <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-6xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary via-primary-light to-primary hover:shadow-xl hover:scale-105 transition-all"
          >
            <Smartphone className="mr-2 h-5 w-5" />
            Essayer maintenant
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Aucun frais caché • Transfert instantané • Support 24/7
          </p>
        </motion.div>
      </div>

      <ModernTopUpModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          navigate('/client');
        }}
        userType="client"
      />
    </section>
  );
};
