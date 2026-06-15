import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ThemeToggleSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Mode Sombre Spectaculaire</h2>
            <Sparkles className="h-8 w-8 text-congo-yellow" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre système de thème adaptatif avec les couleurs vibrantes du Congo. 
            Basculez entre les modes clair, sombre et automatique pour une expérience optimale.
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="card-congo-electric max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Palette className="h-5 w-5" />
                Contrôle du thème
              </CardTitle>
              <CardDescription>
                Choisissez votre mode d'affichage préféré
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <ThemeToggle variant="full" size="lg" />
              <div className="text-sm text-muted-foreground text-center">
                Le thème s'adapte aussi automatiquement à l'heure de la journée
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-congo-yellow rounded-full flex items-center justify-center mb-2">
                ☀️
              </div>
              <CardTitle>Mode Clair</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Interface lumineuse et moderne, parfaite pour le jour
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-congo-blue rounded-full flex items-center justify-center mb-2">
                🌙
              </div>
              <CardTitle>Mode Sombre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Interface élégante pour vos yeux, idéale le soir
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-2">
                🖥️
              </div>
              <CardTitle>Mode Auto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Suit automatiquement les réglages de votre appareil
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};