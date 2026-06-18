import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const CongoColorShowcase = () => {
  return (
    <div className="container-section py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-display-lg text-congo-red mb-2">
          Système Congo Design 🇨🇩
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Couleurs harmonieuses et professionnelles pour TAGA Taxi
        </p>
      </div>

      {/* Congo Color Palette */}
      <Card className="card-congo">
        <CardHeader>
          <CardTitle className="text-congo-red">Palette Congo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-congo-red rounded-lg mx-auto mb-2 shadow-elegant"></div>
              <p className="text-sm font-medium">Congo Red</p>
              <p className="text-xs text-muted-foreground">HSL(357, 79%, 54%)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-congo-yellow rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Congo Yellow</p>
              <p className="text-xs text-muted-foreground">HSL(42, 89%, 52%)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-congo-green rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Congo Green</p>
              <p className="text-xs text-muted-foreground">HSL(142, 76%, 36%)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-congo-blue rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Congo Blue</p>
              <p className="text-xs text-muted-foreground">HSL(220, 100%, 40%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Congo Gradients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-congo-blue">Gradients Congo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="h-20 bg-congo-flag rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Gradient Drapeau Congo</span>
            </div>
            <div className="h-20 bg-congo-modern rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Gradient Moderne Animé</span>
            </div>
            <div className="h-20 bg-congo-subtle rounded-lg flex items-center justify-center">
              <span className="text-foreground font-bold">Gradient Subtil</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons & Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-congo-green">Éléments Interactifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button className="btn-congo">Button Congo</Button>
            <Button variant="outline" className="border-congo-blue text-congo-blue hover:bg-congo-blue hover:text-white">
              Outline Congo
            </Button>
            <Button className="bg-congo-green hover:bg-congo-blue text-white">
              Success Action
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="status-success">Succès</Badge>
            <Badge className="status-warning">Attention</Badge>
            <Badge className="status-info">Information</Badge>
            <Badge className="status-error">Erreur</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-congo-green">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-congo-green rounded-full animate-congo-pulse"></div>
              <div>
                <p className="text-congo-green font-semibold">Service Actif</p>
                <p className="text-sm text-muted-foreground">Tous systèmes opérationnels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-congo-yellow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-congo-yellow rounded-full"></div>
              <div>
                <p className="text-congo-yellow font-semibold">En Attente</p>
                <p className="text-sm text-muted-foreground">Traitement en cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-congo-blue">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-congo-blue rounded-full"></div>
              <div>
                <p className="text-congo-blue font-semibold">Information</p>
                <p className="text-sm text-muted-foreground">Nouvelle mise à jour</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-congo-red">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-congo-red rounded-full"></div>
              <div>
                <p className="text-congo-red font-semibold">Action Requise</p>
                <p className="text-sm text-muted-foreground">Intervention nécessaire</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Typography with Congo Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-congo-yellow">Typographie Congo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-display-md text-congo-red">Display Large Congo</h1>
          <h2 className="text-heading-lg text-congo-blue">Heading Large Congo</h2>
          <h3 className="text-heading-md text-congo-green">Heading Medium Congo</h3>
          <p className="text-body-lg text-congo-yellow">
            Texte corporel utilisant les couleurs harmonieuses du Congo pour une identité visuelle forte et professionnelle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CongoColorShowcase;