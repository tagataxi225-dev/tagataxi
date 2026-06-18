import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, Shield, Settings, Clock, FileText, CheckCircle2 } from "lucide-react";
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const Cookies = () => {
  const cookieTypes = [
    {
      name: "Cookies Essentiels",
      icon: <Shield className="w-6 h-6" />,
      description: "Nécessaires au fonctionnement du site",
      examples: ["Session utilisateur", "Authentification", "Préférences de langue"],
      duration: "Session / 1 an",
      required: true,
      color: "bg-green-500/10 text-green-600"
    },
    {
      name: "Cookies Analytiques",
      icon: <FileText className="w-6 h-6" />,
      description: "Nous aident à comprendre l'utilisation de l'application",
      examples: ["Pages visitées", "Temps de navigation", "Taux de conversion"],
      duration: "2 ans",
      required: false,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      name: "Cookies Fonctionnels",
      icon: <Settings className="w-6 h-6" />,
      description: "Améliorent votre expérience utilisateur",
      examples: ["Thème sombre/clair", "Localisation", "Favoris"],
      duration: "1 an",
      required: false,
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  const thirdPartyCookies = [
    {
      service: "Google Maps",
      purpose: "Géolocalisation et calcul d'itinéraires",
      data: "Position GPS, recherches d'adresses",
      link: "https://policies.google.com/privacy"
    },
    {
      service: "Supabase",
      purpose: "Authentification et stockage de données",
      data: "Identifiants de session, préférences utilisateur",
      link: "https://supabase.com/privacy"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="mb-2">
            <Cookie className="w-3 h-3 mr-1" />
            Politique de Cookies
          </Badge>
          <h1 className="text-display-lg">Utilisation des Cookies</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Cette page explique comment TAGA Taxi utilise les cookies pour améliorer votre expérience
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Dernière mise à jour : 27 octobre 2024
          </p>
        </div>

        {/* Qu'est-ce qu'un cookie */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              Qu'est-ce qu'un cookie ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) 
              lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et 
              préférences pour améliorer votre expérience.
            </p>
            <p>
              TAGA Taxi utilise des cookies pour assurer le bon fonctionnement de l'application, 
              sécuriser votre compte et personnaliser votre expérience.
            </p>
          </CardContent>
        </Card>

        {/* Types de cookies */}
        <div className="mb-12">
          <h2 className="text-heading-lg mb-6">Types de cookies utilisés</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {cookieTypes.map((type, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center mb-4`}>
                    {type.icon}
                  </div>
                  <CardTitle className="text-heading-sm">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Exemples :</h4>
                    <ul className="space-y-1">
                      {type.examples.map((example, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Durée :</span>
                      <span className="font-medium">{type.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Requis :</span>
                      <Badge variant={type.required ? "default" : "secondary"}>
                        {type.required ? "Oui" : "Optionnel"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cookies tiers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Cookies de services tiers
            </CardTitle>
            <CardDescription>
              TAGA Taxi utilise des services tiers qui peuvent déposer leurs propres cookies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {thirdPartyCookies.map((service, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{service.service}</h4>
                    <a 
                      href={service.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Politique de confidentialité
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Objectif :</strong> {service.purpose}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Données collectées :</strong> {service.data}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gestion des cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Gestion de vos cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Vous pouvez à tout moment choisir de désactiver les cookies via les paramètres de votre navigateur. 
              Attention : désactiver les cookies essentiels peut empêcher le bon fonctionnement de l'application.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Instructions par navigateur :</h4>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de sites</li>
                <li>• <strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies et données de sites</li>
                <li>• <strong>Safari :</strong> Préférences → Confidentialité → Gérer les données de sites web</li>
                <li>• <strong>Edge :</strong> Paramètres → Cookies et autorisations du site → Cookies et données de site</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Mise à jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Mise à jour de cette politique
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Nous nous réservons le droit de modifier cette politique de cookies à tout moment. 
              Toute modification sera publiée sur cette page avec une date de mise à jour actualisée.
            </p>
            <p>
              Nous vous encourageons à consulter régulièrement cette page pour rester informé de notre 
              utilisation des cookies.
            </p>
          </CardContent>
        </Card>
      </main>

      <ModernFooter />
    </div>
  );
};

export default Cookies;
