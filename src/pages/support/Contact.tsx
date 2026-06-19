import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, MessageCircle, HeadphonesIcon } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const Contact = () => {
  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Téléphone",
      description: "Appelez-nous directement",
      value: "+243 858 040 400",
      available: "24h/24, 7j/7",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      description: "Écrivez-nous vos questions",
      value: "contact@tagago.app",
      available: "Réponse sous 2h",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Chat en direct",
      description: "Discussion instantanée",
      value: "Disponible dans l'app",
      available: "24h/24, 7j/7",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: <HeadphonesIcon className="w-6 h-6" />,
      title: "Support WhatsApp",
      description: "Via WhatsApp Business",
      value: "+243 858 040 400",
      available: "Lun-Dim 6h-22h",
      color: "bg-primary-glow/10 text-primary-glow"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <Badge variant="secondary" className="mb-4">
            Nous contacter
          </Badge>
          <h1 className="text-display-lg">Comment pouvons-nous vous aider ?</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Notre équipe est là pour répondre à toutes vos questions sur TAGA Taxi
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-lg">Envoyez-nous un message</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input placeholder="Votre prénom" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input placeholder="Votre nom" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" placeholder="votre@email.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input placeholder="+243 858 040 400" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet *</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Question transport</SelectItem>
                    <SelectItem value="livraison">Question livraison</SelectItem>
                    <SelectItem value="marketplace">Question marketplace</SelectItem>
                    <SelectItem value="wallet">Question portefeuille</SelectItem>
                    <SelectItem value="partnership">Partenariat</SelectItem>
                    <SelectItem value="technical">Problème technique</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message *</label>
                <Textarea 
                  placeholder="Décrivez votre question ou problème en détail..."
                  className="min-h-32"
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-primary-glow">
                Envoyer le message
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                * Champs obligatoires. Nous nous engageons à répondre sous 2h en moyenne.
              </p>
            </CardContent>
          </Card>

          {/* Contact Methods & Info */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="space-y-6">
              <h2 className="text-heading-lg">Autres moyens de contact</h2>
              <div className="grid gap-4">
                {contactMethods.map((method, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${method.color}`}>
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-body-lg">{method.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                          <p className="font-medium">{method.value}</p>
                          <p className="text-xs text-muted-foreground">{method.available}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Office Info */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Notre bureau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">TAGA Taxi SARL</h4>
                  <p className="text-sm text-muted-foreground">
                    Avenue de l'Université<br />
                    Commune de Kinshasa<br />
                    République Démocratique du Congo
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Lundi - Dimanche : 24h/24</span>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Développé par{" "}
                    <a 
                      href="https://wa.me/2250100540707" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      ICON
                    </a>
                    {" • Propulsé par "}
                    <a 
                      href="https://itec-sarlu.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      ITEC
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ModernFooter />
    </div>
  );
};

export default Contact;