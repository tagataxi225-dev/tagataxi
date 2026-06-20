import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Code, Server, Mail, Phone, MapPin, Shield, FileText } from "lucide-react";
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const LegalNotice = () => {
  const sections = [
    {
      title: "Éditeur de l'application",
      icon: <Building2 className="w-5 h-5" />,
      content: [
        { label: "Nom commercial", value: "TAGA Taxi" },
        { label: "Forme juridique", value: "Société à Responsabilité Limitée (SARL)" },
        { label: "Siège social", value: "Kinshasa, République Démocratique du Congo" },
        { label: "Email", value: "legal@tagago.app" },
        { label: "Téléphone", value: "+243 858 040 400" }
      ]
    },
    {
      title: "Développement technique",
      icon: <Code className="w-5 h-5" />,
      content: [
        { label: "Développeur", value: "ICON SARL", link: "https://wa.me/2250100540707" },
        { label: "Description", value: "Agence spécialisée en développement d'applications web et mobiles" },
        { label: "Services", value: "Architecture, Design UI/UX, Développement React/TypeScript" }
      ]
    },
    {
      title: "Infrastructure & Propulsion",
      icon: <Server className="w-5 h-5" />,
      content: [
        { label: "Développé par", value: "ITEC", link: "https://itec-sarlu.com" },
        { label: "Hébergement base de données", value: "Supabase (États-Unis)" },
        { label: "Hébergement frontend", value: "Infrastructure Cloud TAGA (CDN Global)" },
        { label: "Services cartographiques", value: "Google Maps API, Mapbox" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="mb-2">
            <FileText className="w-3 h-3 mr-1" />
            Informations légales
          </Badge>
          <h1 className="text-display-lg">Mentions Légales</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Informations légales concernant l'application TAGA Taxi et ses services
          </p>
        </div>

        {/* Sections principales */}
        {sections.map((section, index) => (
          <Card key={index} className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-heading-md">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {section.icon}
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.content.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b last:border-0">
                    <span className="text-sm font-semibold text-muted-foreground min-w-[180px]">
                      {item.label} :
                    </span>
                    {item.link ? (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm font-medium">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Directeur de publication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Directeur de publication
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>
              Le directeur de publication de l'application TAGA Taxi est responsable du contenu éditorial 
              et des services proposés sur la plateforme.
            </p>
            <p className="font-medium text-foreground">
              Contact : publication@tagago.app
            </p>
          </CardContent>
        </Card>

        {/* Propriété intellectuelle */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Propriété intellectuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              L'ensemble des contenus présents sur l'application TAGA Taxi (textes, images, graphismes, 
              logo, icônes, sons, logiciels, etc.) est la propriété exclusive de TAGA Taxi ou de ses 
              partenaires et est protégé par les lois congolaises et internationales relatives à la 
              propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
              des éléments de l'application, quel que soit le moyen ou le procédé utilisé, est interdite, 
              sauf autorisation écrite préalable.
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Marques déposées :</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• TAGA Taxi® - Marque déposée</li>
                <li>• Logo TAGA - Droits réservés</li>
                <li>• TAGAPay - Marque de service</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Responsabilité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Limitation de responsabilité</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              TAGA Taxi met tout en œuvre pour offrir aux utilisateurs des informations et services 
              fiables et de qualité. Cependant, nous ne pouvons garantir l'exactitude, la précision ou 
              l'exhaustivité des informations disponibles sur l'application.
            </p>
            <p>
              TAGA Taxi ne saurait être tenu responsable :
            </p>
            <ul className="space-y-2 ml-6">
              <li>• Des dommages directs ou indirects causés par l'utilisation de l'application</li>
              <li>• Des interruptions temporaires du service pour maintenance ou mise à jour</li>
              <li>• Des erreurs ou omissions dans le contenu</li>
              <li>• Des dysfonctionnements techniques indépendants de notre volonté</li>
            </ul>
          </CardContent>
        </Card>

        {/* Protection des données */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Protection des données personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              TAGA Taxi accorde une grande importance à la protection de vos données personnelles. 
              Le traitement de vos données est effectué conformément aux législations en vigueur.
            </p>
            <p>
              Pour en savoir plus sur la collecte, l'utilisation et la protection de vos données, 
              consultez notre{" "}
              <a href="/legal/privacy" className="text-primary hover:underline font-medium">
                Politique de confidentialité
              </a>
              .
            </p>
          </CardContent>
        </Card>

        {/* Contact légal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact légal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Adresse postale</p>
                  <p className="text-sm text-muted-foreground">
                    TAGA Taxi<br />
                    Kinshasa, République Démocratique du Congo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Email légal</p>
                  <a href="mailto:legal@tagago.app" className="text-sm text-primary hover:underline">
                    legal@tagago.app
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <a href="tel:+243858040400" className="text-sm text-primary hover:underline">
                    +243 858 040 400
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note finale */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Ces mentions légales ont été mises à jour le 27 octobre 2024.<br />
            TAGA Taxi se réserve le droit de les modifier à tout moment.
          </p>
        </div>
      </main>

      <ModernFooter />
    </div>
  );
};

export default LegalNotice;
