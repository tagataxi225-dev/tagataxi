import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'signup' | 'conversion' | 'milestone';
  message: string;
  time: string;
}

const SAMPLE_ACTIVITIES: Activity[] = [
  { id: '1', type: 'signup', message: 'Jean vient de s\'inscrire à Ngaliema', time: 'Il y a 2 min' },
  { id: '2', type: 'conversion', message: 'Marie a commandé sa 1ère course', time: 'Il y a 5 min' },
  { id: '3', type: 'signup', message: 'Patrick vient de s\'inscrire à Gombe', time: 'Il y a 8 min' },
  { id: '4', type: 'milestone', message: '12,500 utilisateurs inscrits !', time: 'Il y a 15 min' },
  { id: '5', type: 'signup', message: 'Grace vient de s\'inscrire à Lemba', time: 'Il y a 18 min' },
];

export const LiveActivityFeed = () => {
  const [currentActivity, setCurrentActivity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % SAMPLE_ACTIVITIES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activity = SAMPLE_ACTIVITIES[currentActivity];

  const getIcon = () => {
    switch (activity.type) {
      case 'signup':
        return <Users className="h-4 w-4" />;
      case 'conversion':
        return <CheckCircle className="h-4 w-4" />;
      case 'milestone':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Activité en temps réel</h3>
            <p className="text-muted-foreground">Ils profitent de l'offre en ce moment</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 min-h-[80px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentActivity}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                  {getIcon()}
                </div>
                <div className="text-left">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-card rounded-lg border border-border">
              <p className="text-2xl font-bold text-primary">1,234</p>
              <p className="text-sm text-muted-foreground">Inscriptions aujourd'hui</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border border-border">
              <p className="text-2xl font-bold text-primary">456</p>
              <p className="text-sm text-muted-foreground">Courses en cours</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border border-border">
              <p className="text-2xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
