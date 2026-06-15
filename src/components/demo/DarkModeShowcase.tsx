import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import CongoButton from '@/components/ui/CongoButton';
import CongoCard from '@/components/ui/CongoCard';

export const DarkModeShowcase = () => {
  return (
    <div className="min-h-screen p-8 space-y-8 bg-background text-foreground transition-colors duration-300">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-4xl font-bold">
          <Palette className="h-10 w-10 text-primary" />
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Tembea Dark Mode
          </span>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Découvrez notre système de thème adaptatif avec les couleurs vibrantes du Congo
        </p>
        <div className="flex justify-center">
          <ThemeToggle variant="full" size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Couleurs de base */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
              Couleurs de base
            </CardTitle>
            <CardDescription>
              Palette principale adaptative
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded"></div>
                <span className="text-sm">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-secondary rounded"></div>
                <span className="text-sm">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-congo-red rounded"></div>
                <span className="text-sm">Congo Red</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-congo-yellow rounded"></div>
                <span className="text-sm">Congo Yellow</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boutons Congo */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Boutons Congo</CardTitle>
            <CardDescription>
              Variantes avec effets adaptatifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CongoButton variant="congo" size="sm">
              Standard
            </CongoButton>
            <CongoButton variant="electric" size="sm">
              Electric
            </CongoButton>
            <CongoButton variant="vibrant" size="sm">
              Vibrant
            </CongoButton>
            <CongoButton variant="glow" size="sm">
              Glow
            </CongoButton>
          </CardContent>
        </Card>

        {/* Cards Congo */}
        <CongoCard variant="electric" className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Congo Card Electric</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Design glassmorphisme adaptatif avec les couleurs du Congo
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">Adaptatif</Badge>
            <Badge variant="outline">Congo</Badge>
          </div>
        </CongoCard>

        {/* États de thème */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>États de thème</CardTitle>
            <CardDescription>
              Modes disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
              <Sun className="h-5 w-5 text-congo-yellow" />
              <div>
                <div className="font-medium">Mode clair</div>
                <div className="text-sm text-muted-foreground">Jour ensoleillé</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
              <Moon className="h-5 w-5 text-congo-blue" />
              <div>
                <div className="font-medium">Mode sombre</div>
                <div className="text-sm text-muted-foreground">Nuit étoilée</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
              <Monitor className="h-5 w-5" />
              <div>
                <div className="font-medium">Automatique</div>
                <div className="text-sm text-muted-foreground">Suit le système</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gradients */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Gradients Congo</CardTitle>
            <CardDescription>
              Dégradés adaptatifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-16 rounded-lg bg-gradient-primary"></div>
            <div className="h-16 rounded-lg bg-gradient-hero"></div>
            <div className="h-16 rounded-lg bg-gradient-success"></div>
          </CardContent>
        </Card>

        {/* Glassmorphisme */}
        <Card className="bg-card border border-border shadow-lg">
          <CardHeader>
            <CardTitle>Glassmorphisme</CardTitle>
            <CardDescription>
              Effet verre adaptatif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Design moderne avec transparence et flou adaptatif selon le thème actuel.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Thème temporel dynamique</h3>
        <p className="text-muted-foreground">
          Le thème s'adapte automatiquement à l'heure de la journée (jour/coucher de soleil/nuit)
          tout en respectant votre préférence de mode sombre/clair
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};